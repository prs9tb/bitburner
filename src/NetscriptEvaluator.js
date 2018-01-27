import {BitNodeMultipliers}                 from "./BitNode.js";
import {CONSTANTS}                          from "./Constants.js";
import {Player}                             from "./Player.js";
import {Environment}                        from "./NetscriptEnvironment.js";
import {WorkerScript, addWorkerScript}      from "./NetscriptWorker.js";
import {Server}                             from "./Server.js";
import {Settings}                           from "./Settings.js";
import {Script, findRunningScript,
        RunningScript}                      from "./Script.js";

import {Node}                               from "../utils/acorn.js";
import {printArray}                         from "../utils/HelperFunctions.js";
import {isValidIPAddress}                   from "../utils/IPAddress.js";
import {isString}                           from "../utils/StringHelperFunctions.js";

var Promise = require("bluebird");

Promise.config({
    warnings: false,
    longStackTraces: false,
    cancellation: true,
    monitoring: false
});
/* Evaluator
 *     Evaluates/Interprets the Abstract Syntax Tree generated by Acorns parser
 *
 * Returns a promise
 */
function evaluate(exp, workerScript) {
    /* return new Promise(function(resolve, reject) {*/
    return Promise.delay(Settings.CodeInstructionRunTime).then(function() {
        var env = workerScript.env;
        if (env.stopFlag) {return Promise.reject(workerScript);}
        if (exp == null) {
            return Promise.reject(makeRuntimeRejectMsg(workerScript, "Error: NULL expression"));
        }
        if (env.stopFlag) {return Promise.reject(workerScript);}
        switch (exp.type) {
            case "BlockStatement":
            case "Program":
                var evaluateProgPromise = evaluateProg(exp, workerScript, 0);  //TODO: make every block/program use individual enviroment
                return evaluateProgPromise.then(function(w) {
                    return Promise.resolve(workerScript);
                }).catch(function(e) {
                    if (e.constructor === Array && e.length === 2 && e[0] === "RETURNSTATEMENT") {
                        return Promise.reject(e);
                    } else if (isString(e)) {
                        workerScript.errorMessage = e;
                        return Promise.reject(workerScript);
                    } else if (e instanceof WorkerScript) {
                        return Promise.reject(e);
                    } else {
                        return Promise.reject(workerScript);
                    }
                });
                break;
            case "Literal":
                return Promise.resolve(exp.value);
                break;
            case "Identifier":
                //Javascript constructor() method can be used as an exploit to run arbitrary code
                if (exp.name == "constructor") {
                    return Promise.reject(makeRuntimeRejectMsg(workerScript, "Illegal usage of constructor() method. If you have your own function named 'constructor', you must re-name it."));
                }

                if (!(exp.name in env.vars)){
                    return Promise.reject(makeRuntimeRejectMsg(workerScript, "variable " + exp.name + " not defined"));
                }
                return Promise.resolve(env.get(exp.name))
                break;
            case "ExpressionStatement":
                return evaluate(exp.expression, workerScript);
                break;
            case "ArrayExpression":
                var argPromises = exp.elements.map(function(arg) {
                    return evaluate(arg, workerScript);
                });
                return Promise.all(argPromises).then(function(array) {
                    return Promise.resolve(array)
                });
                break;
            case "CallExpression":
                return evaluate(exp.callee, workerScript).then(function(func) {
                    return Promise.map(exp.arguments, function(arg) {
                        return evaluate(arg, workerScript);
                    }).then(function(args) {
                        if (func instanceof Node) { //Player-defined function
                            //Create new Environment for the function
                            //Should be automatically garbage collected...
                            var funcEnv = env.extend();

                            //Define function arguments in this new environment
                            for (var i = 0; i < func.params.length; ++i) {
                                var arg;
                                if (i >= args.length) {
                                    arg = null;
                                } else {
                                    arg = args[i];
                                }
                                funcEnv.def(func.params[i].name, arg);
                            }

                            //Create a new WorkerScript for this function evaluation
                            var funcWorkerScript = new WorkerScript(workerScript.scriptRef);
                            funcWorkerScript.serverIp = workerScript.serverIp;
                            funcWorkerScript.env = funcEnv;
                            workerScript.fnWorker = funcWorkerScript;

                            return evaluate(func.body, funcWorkerScript).then(function(res) {
                                //If the function finished successfuly, that means there
                                //was no return statement since a return statement rejects. So resolve to null
                                workerScript.fnWorker = null;
                                return Promise.resolve(null);
                            }).catch(function(e) {
                                if (e.constructor === Array && e.length === 2 && e[0] === "RETURNSTATEMENT") {
                                    //Return statement from function
                                    return Promise.resolve(e[1]);
                                    workerScript.fnWorker = null;
                                } else if (isString(e)) {
                                    return Promise.reject(makeRuntimeRejectMsg(workerScript, e));
                                } else if (e instanceof WorkerScript) {
                                    //Parse out the err message from the WorkerScript and re-reject
                                    var errorMsg = e.errorMessage;
                                    var errorTextArray = errorMsg.split("|");
                                    if (errorTextArray.length === 4) {
                                        errorMsg = errorTextArray[3];
                                        return Promise.reject(makeRuntimeRejectMsg(workerScript, errorMsg));
                                    } else {
                                        if (env.stopFlag) {
                                            return Promise.reject(workerScript);
                                        } else {
                                            return Promise.reject(makeRuntimeRejectMsg(workerScript, "Error in one of your functions. Could not identify which function"));
                                        }
                                    }
                                } else if (e instanceof Error) {
                                    return Promise.reject(makeRuntimeRejectMsg(workerScript, e.toString()));
                                }
                            });
                        } else if (exp.callee.type == "MemberExpression"){
                            return evaluate(exp.callee.object, workerScript).then(function(object) {
                                try {
                                    var res = func.apply(object,args);
                                    return Promise.resolve(res);
                                } catch (e) {
                                    return Promise.reject(makeRuntimeRejectMsg(workerScript, e));
                                }
                            });
                        } else {
                            try {
                                var out = func.apply(null,args);
                                if (out instanceof Promise){
                                    return out.then(function(res) {
                                        return Promise.resolve(res)
                                    }).catch(function(e) {
                                        return Promise.reject(e);
                                    });
                                } else {
                                    return Promise.resolve(out);
                                }
                            } catch (e) {
                                if (isScriptErrorMessage(e)) {
                                    return Promise.reject(e);
                                } else {
                                    return Promise.reject(makeRuntimeRejectMsg(workerScript, e));
                                }
                            }
                        }
                    });
                });
                break;
            case "MemberExpression":
                return evaluate(exp.object, workerScript).then(function(object) {
                    if (exp.computed){
                        return evaluate(exp.property, workerScript).then(function(index) {
                            if (index >= object.length) {
                                return Promise.reject(makeRuntimeRejectMsg(workerScript, "Invalid index for arrays"));
                            }
                            return Promise.resolve(object[index]);
                        }).catch(function(e) {
                            if (e instanceof WorkerScript || isScriptErrorMessage(e)) {
                                return Promise.reject(e);
                            } else {
                                return Promise.reject(makeRuntimeRejectMsg(workerScript, "Invalid MemberExpression"));
                            }
                        });
                    } else {
                        if (exp.property.name === "constructor") {
                            return Promise.reject(makeRuntimeRejectMsg(workerScript, "Illegal usage of constructor() method. If you have your own function named 'constructor', you must re-name it."));
                        }
                        try {
                            return Promise.resolve(object[exp.property.name])
                        } catch (e) {
                            return Promise.reject(makeRuntimeRejectMsg(workerScript, "Failed to get property: " + e.toString()));
                        }
                    }
                });
                break;
            case "LogicalExpression":
            case "BinaryExpression":
                return evalBinary(exp, workerScript);
                break;
            case "UnaryExpression":
                return evalUnary(exp, workerScript);
                break;
            case "AssignmentExpression":
                return evalAssignment(exp, workerScript);
                break;
            case "UpdateExpression":
                if (exp.argument.type==="Identifier"){
                    if (exp.argument.name in env.vars){
                        if (exp.operator === "++" || exp.operator === "--") {
                            switch (exp.operator) {
                                case "++":
                                    env.set(exp.argument.name,env.get(exp.argument.name)+1);
                                    break;
                                case "--":
                                    env.set(exp.argument.name,env.get(exp.argument.name)-1);
                                    break;
                                default: break;
                            }
                            return Promise.resolve(env.get(exp.argument.name));
                        }
                        //Not sure what prefix UpdateExpressions there would be besides ++/--
                        if (exp.prefix){
                            return Promise.resolve(env.get(exp.argument.name))
                        }
                        switch (exp.operator){
                            default:
                                return Promise.reject(makeRuntimeRejectMsg(workerScript, "Unrecognized token: " + exp.type + ". You are trying to use code that is currently unsupported"));
                        }
                        return Promise.resolve(env.get(exp.argument.name))
                    } else {
                        return Promise.reject(makeRuntimeRejectMsg(workerScript, "variable " + exp.argument.name + " not defined"));
                    }
                } else {
                    return Promise.reject(makeRuntimeRejectMsg(workerScript, "argument must be an identifier"));
                }
                break;
            case "EmptyStatement":
                return Promise.resolve(false);
                break;
            case "ReturnStatement":
                return evaluate(exp.argument, workerScript).then(function(res) {
                    return Promise.reject(["RETURNSTATEMENT", res]);
                });
                break;
            case "BreakStatement":
                return Promise.reject("BREAKSTATEMENT");
                break;
            case "ContinueStatement":
                return Promise.reject("CONTINUESTATEMENT");
                break;
            case "IfStatement":
                return evaluateIf(exp, workerScript);
                break;
            case "SwitchStatement":
                var lineNum = getErrorLineNumber(exp, workerScript);
                return Promise.reject(makeRuntimeRejectMsg(workerScript, "Switch statements are not yet implemented in Netscript (line " + (lineNum+1) + ")"));
                break;
            case "WhileStatement":
                return evaluateWhile(exp, workerScript).then(function(res) {
                    return Promise.resolve(res);
                }).catch(function(e) {
                    if (e == "BREAKSTATEMENT" ||
                       (e instanceof WorkerScript && e.errorMessage == "BREAKSTATEMENT")) {
                        return Promise.resolve("whileLoopBroken");
                    } else {
                        return Promise.reject(e);
                    }
                });
                break;
            case "ForStatement":
                return evaluate(exp.init, workerScript).then(function(expInit) {
                    return evaluateFor(exp, workerScript);
                }).then(function(forLoopRes) {
                    return Promise.resolve("forLoopDone");
                }).catch(function(e) {
                    if (e == "BREAKSTATEMENT" ||
                       (e instanceof WorkerScript && e.errorMessage == "BREAKSTATEMENT")) {
                        return Promise.resolve("forLoopBroken");
                    } else {
                        return Promise.reject(e);
                    }
                });
                break;
            case "FunctionDeclaration":
                if (exp.id && exp.id.name) {
                    env.set(exp.id.name, exp);
                    return Promise.resolve(true);
                } else {
                    var lineNum = getErrorLineNumber(exp, workerScript);
                    return Promise.reject(makeRuntimeRejectMsg(workerScript, "Invalid function declaration at line " + lineNum+1));
                }
                break;
            default:
                var lineNum = getErrorLineNumber(exp, workerScript);
                return Promise.reject(makeRuntimeRejectMsg(workerScript, "Unrecognized token: " + exp.type + " (line " + (lineNum+1) + "). This is currently unsupported in Netscript"));
                break;
        } //End switch
    }).catch(function(e) {
        return Promise.reject(e);
    }); // End Promise
}

function evalBinary(exp, workerScript){
    return evaluate(exp.left, workerScript).then(function(expLeft) {
        //Short circuiting
        if (expLeft == true && exp.operator === "||") {
            return Promise.resolve(true);
        }
        if (expLeft == false && exp.operator === "&&") {
            return Promise.resolve(false);
        }
        return evaluate(exp.right, workerScript).then(function(expRight) {
            switch (exp.operator){
                case "===":
                case "==":
                    return Promise.resolve(expLeft===expRight);
                    break;
                case "!==":
                case "!=":
                    return Promise.resolve(expLeft!==expRight);
                    break;
                case "<":
                    return Promise.resolve(expLeft<expRight);
                    break;
                case "<=":
                    return Promise.resolve(expLeft<=expRight);
                    break;
                case ">":
                    return Promise.resolve(expLeft>expRight);
                    break;
                case ">=":
                    return Promise.resolve(expLeft>=expRight);
                    break;
                case "+":
                    return Promise.resolve(expLeft+expRight);
                    break;
                case "-":
                    return Promise.resolve(expLeft-expRight);
                    break;
                case "*":
                    return Promise.resolve(expLeft*expRight);
                    break;
                case "/":
                    if (expRight === 0) {
                        return Promise.reject(makeRuntimeRejectMsg(workerScript, "ERROR: Divide by zero"));
                    } else {
                        return Promise.resolve(expLeft/expRight);
                    }
                    break;
                case "%":
                    return Promise.resolve(expLeft%expRight);
                    break;
                case "in":
                    return Promise.resolve(expLeft in expRight);
                    break;
                case "instanceof":
                    return Promise.resolve(expLeft instanceof expRight);
                    break;
                case "||":
                    return Promise.resolve(expLeft || expRight);
                    break;
                case "&&":
                    return Promise.resolve(expLeft && expRight);
                    break;
                default:
                    return Promise.reject(makeRuntimeRejectMsg(workerScript, "Unsupported operator: " + exp.operator));
            }
        });
    });
}

function evalUnary(exp, workerScript){
    var env = workerScript.env;
    if (env.stopFlag) {return Promise.reject(workerScript);}
    return evaluate(exp.argument, workerScript).then(function(res) {
        if (exp.operator == "!") {
            return Promise.resolve(!res);
        } else if (exp.operator == "-") {
            if (isNaN(res)) {
                return Promise.resolve(res);
            } else {
                return Promise.resolve(-1 * res);
            }
        } else {
            return Promise.reject(makeRuntimeRejectMsg(workerScript, "Unimplemented unary operator: " + exp.operator));
        }
    });
}

//Takes in a MemberExpression that should represent a Netscript array (possible multidimensional)
//The return value is an array of the form:
//    [0th index (leftmost), array name, 1st index, 2nd index, ...]
function getArrayElement(exp, workerScript) {
    var indices = [];
    return evaluate(exp.property, workerScript).then(function(idx) {
        if (isNaN(idx)) {
            return Promise.reject(makeRuntimeRejectMsg(workerScript, "Invalid access to array. Index is not a number: " + idx));
        } else {
            if (exp.object.name === undefined && exp.object.object) {
                return getArrayElement(exp.object, workerScript).then(function(res) {
                    res.push(idx);
                    indices = res;
                    return Promise.resolve(indices);
                }).catch(function(e) {
                    return Promise.reject(e);
                });
            } else {
                indices.push(idx);
                indices.push(exp.object.name);
                return Promise.resolve(indices);
            }
        }
    });
}

function evalAssignment(exp, workerScript) {
    var env = workerScript.env;
    if (env.stopFlag) {return Promise.reject(workerScript);}

    if (exp.left.type != "Identifier" && exp.left.type != "MemberExpression") {
        return Promise.reject(makeRuntimeRejectMsg(workerScript, "Cannot assign to " + JSON.stringify(exp.left)));
    }

    if (exp.operator !== "=" && !(exp.left.name in env.vars)){
        return Promise.reject(makeRuntimeRejectMsg(workerScript, "variable " + exp.left.name + " not defined"));
    }

    return evaluate(exp.right, workerScript).then(function(expRight) {
        if (exp.left.type == "MemberExpression") {
            //Assign to array element
            //Array object designed by exp.left.object.name
            //Index designated by exp.left.property
            return getArrayElement(exp.left, workerScript).then(function(res) {
                if (!(res instanceof Array) || res.length < 2) {
                    return Promise.reject(makeRuntimeRejectMsg(workerScript, "Error evaluating array assignment. This is (probably) a bug please report to game dev"));
                }

                //The array name is the second value
                var arrName = res.splice(1, 1);
                arrName = arrName[0];

                env.setArrayElement(arrName, res, expRight);
                return Promise.resolve(false);
            }).catch(function(e) {
                return Promise.reject(e);
            });
        } else {
            //Other assignments
            try {
                switch (exp.operator) {
                    case "=":
                        env.set(exp.left.name,expRight);
                        break;
                    case "+=":
                        env.set(exp.left.name,env.get(exp.left.name) + expRight);
                        break;
                    case "-=":
                        env.set(exp.left.name,env.get(exp.left.name) - expRight);
                        break;
                    case "*=":
                        env.set(exp.left.name,env.get(exp.left.name) * expRight);
                        break;
                    case "/=":
                        env.set(exp.left.name,env.get(exp.left.name) / expRight);
                        break;
                    case "%=":
                        env.set(exp.left.name,env.get(exp.left.name) % expRight);
                        break;
                    default:
                        return Promise.reject(makeRuntimeRejectMsg(workerScript, "Bitwise assignment is not implemented"));
                }
                return Promise.resolve(false);
            } catch (e) {
                return Promise.reject(makeRuntimeRejectMsg(workerScript, "Failed to set environment variable: " + e.toString()));
            }
        }
    });
}

function evaluateIf(exp, workerScript, i) {
    var env = workerScript.env;
    return evaluate(exp.test, workerScript).then(function(condRes) {
        if (condRes) {
            return evaluate(exp.consequent, workerScript).then(function(res) {
                return Promise.resolve(true);
            }, function(e) {
                return Promise.reject(e);
            });
        } else if (exp.alternate) {
            return evaluate(exp.alternate, workerScript).then(function(res) {
                return Promise.resolve(true);
            }, function(e) {
                return Promise.reject(e);
            });
        } else {
            return Promise.resolve("endIf");
        }
    });
}

//Evaluate the looping part of a for loop (Initialization block is NOT done in here)
function evaluateFor(exp, workerScript) {
    var env = workerScript.env;
    if (env.stopFlag) {return Promise.reject(workerScript);}
    return new Promise(function(resolve, reject) {
        function recurse() {
            //Don't return a promise so the promise chain is broken on each recursion (saving memory)
            evaluate(exp.test, workerScript).then(function(resCond) {
                if (resCond) {
                    return evaluate(exp.body, workerScript).then(function(res) {
                        return evaluate(exp.update, workerScript);
                    }).catch(function(e) {
                        if (e == "CONTINUESTATEMENT" ||
                           (e instanceof WorkerScript && e.errorMessage == "CONTINUESTATEMENT")) {
                                //Continue statement, recurse to next iteration
                                return evaluate(exp.update, workerScript).then(function(resPostloop) {
                                    return evaluateFor(exp, workerScript);
                                }).then(function(foo) {
                                    return Promise.resolve("endForLoop");
                                }).catch(function(e) {
                                    return Promise.reject(e);
                                });
                        } else {
                            return Promise.reject(e);
                        }
                    }).then(recurse, reject).catch(function(e) {
                        return Promise.reject(e);
                    });
                } else {
                    resolve();
                }
            }).catch(function(e) {
                reject(e);
            });
        }
        recurse();
    });
    /*
    return evaluate(exp.test, workerScript).then(function(resCond) {
        if (resCond) {
            //Execute code (body), update, and then recurse
            return evaluate(exp.body, workerScript).then(function(resCode) {
                return evaluate(exp.update, workerScript);
            }).catch(function(e) {
                if (e == "CONTINUESTATEMENT" ||
                   (e instanceof WorkerScript && e.errorMessage == "CONTINUESTATEMENT")) {
                        //Continue statement, recurse to next iteration
                        return evaluate(exp.update, workerScript).then(function(resPostloop) {
                            return evaluateFor(exp, workerScript);
                        }).then(function(foo) {
                            return Promise.resolve("endForLoop");
                        }).catch(function(e) {
                            return Promise.reject(e);
                        });
                } else {
                    return Promise.reject(e);
                }
            }).then(function(resPostloop) {
                    return evaluateFor(exp, workerScript);
            }).then(function(foo) {
                return Promise.resolve("endForLoop");
            });
        } else {
            return Promise.resolve("endForLoop");    //Doesn't need to resolve to any particular value
        }
    });*/
}

function evaluateWhile(exp, workerScript) {
    var env = workerScript.env;
    if (env.stopFlag) {return Promise.reject(workerScript);}
    return new Promise(function (resolve, reject) {
        function recurse() {
            //Don't return a promise so the promise chain is broken on each recursion (saving memory)
            evaluate(exp.test, workerScript).then(function(resCond) {
                if (resCond) {
                    return evaluate(exp.body, workerScript).catch(function(e) {
                        if (e == "CONTINUESTATEMENT" ||
                           (e instanceof WorkerScript && e.errorMessage == "CONTINUESTATEMENT")) {
                            //Continue statement, recurse
                            return evaluateWhile(exp, workerScript).then(function(foo) {
                                return Promise.resolve("endWhileLoop");
                            }, function(e) {
                                return Promise.reject(e);
                            });
                        } else {
                            return Promise.reject(e);
                        }
                    }).then(recurse, reject).catch(function(e) {
                        return Promise.reject(e);
                    });
                } else {
                    resolve();
                }
            }).catch(function(e) {
                reject(e);
            });
        }
        recurse();
    });
}

function evaluateProg(exp, workerScript, index) {
    var env = workerScript.env;
    if (env.stopFlag) {return Promise.reject(workerScript);}
    if (index >= exp.body.length) {
        return Promise.resolve("progFinished");
    } else {
        //Evaluate this line of code in the prog
        //After the code finishes evaluating, evaluate the next line recursively
        return evaluate(exp.body[index], workerScript).then(function(res) {
            return evaluateProg(exp, workerScript, index + 1);
        }).then(function(res) {
            return Promise.resolve(workerScript);
        }).catch(function(e) {
            return Promise.reject(e);
        });
    }
}

function killNetscriptDelay(workerScript) {
    /*
    if (workerScript instanceof WorkerScript) {
        if (workerScript.delay) {
            workerScript.delay.cancel();
        }
    }
    */
    if (workerScript instanceof WorkerScript) {
        if (workerScript.delay) {
            clearTimeout(workerScript.delay);
            workerScript.delayResolve();
        }
    }
}

function netscriptDelay(time, workerScript) {
    /*
    workerScript.delay = new Promise(function(resolve, reject, onCancel) {
        Promise.delay(time).then(function() {
            resolve();
            workerScript.delay = null;
        });
        onCancel(function() {
            console.log("Cancelling and rejecting this Promise");
            reject(workerScript);
        })
    });
    return workerScript.delay;
    */
    return new Promise(function(resolve, reject) {
       workerScript.delay = setTimeout(()=>{
           workerScript.delay = null;
           resolve();
       }, time);
       workerScript.delayResolve = resolve;
   });
}

function makeRuntimeRejectMsg(workerScript, msg) {
    return "|"+workerScript.serverIp+"|"+workerScript.name+"|" + msg;
}

/*
function apply_op(op, a, b) {
    function num(x) {
        if (typeof x != "number")
            throw new Error("Expected number but got " + x);
        return x;
    }
    function div(x) {
        if (num(x) == 0)
            throw new Error("Divide by zero");
        return x;
    }
    switch (op) {
      case "+": return a + b;
      case "-": return num(a) - num(b);
      case "*": return num(a) * num(b);
      case "/": return num(a) / div(b);
      case "%": return num(a) % div(b);
      case "&&": return a !== false && b;
      case "||": return a !== false ? a : b;
      case "<": return num(a) < num(b);
      case ">": return num(a) > num(b);
      case "<=": return num(a) <= num(b);
      case ">=": return num(a) >= num(b);
      case "==": return a === b;
      case "!=": return a !== b;
    }
    throw new Error("Can't apply operator " + op);
}
*/

//Run a script from inside a script using run() command
function runScriptFromScript(server, scriptname, args, workerScript, threads=1) {
    //Check if the script is already running
    var runningScriptObj = findRunningScript(scriptname, args, server);
    if (runningScriptObj != null) {
        workerScript.scriptRef.log(scriptname + " is already running on " + server.hostname);
        return Promise.resolve(false);
    }

    //Check if the script exists and if it does run it
    for (var i = 0; i < server.scripts.length; ++i) {
        if (server.scripts[i].filename == scriptname) {
            //Check for admin rights and that there is enough RAM availble to run
            var script = server.scripts[i];
            var ramUsage = script.ramUsage;
            threads = Math.round(Number(threads)); //Convert to number and round
            ramUsage = ramUsage * threads * Math.pow(CONSTANTS.MultithreadingRAMCost, threads-1);
            var ramAvailable = server.maxRam - server.ramUsed;

            if (server.hasAdminRights == false) {
                workerScript.scriptRef.log("Cannot run script " + scriptname + " on " + server.hostname + " because you do not have root access!");
                return Promise.resolve(false);
            } else if (ramUsage > ramAvailable){
                workerScript.scriptRef.log("Cannot run script " + scriptname + "(t=" + threads + ") on " + server.hostname + " because there is not enough available RAM!");
                return Promise.resolve(false);
            } else {
                //Able to run script
                workerScript.scriptRef.log("Running script: " + scriptname + " on " + server.hostname + " with " + threads + " threads and args: " + printArray(args) + ". May take a few seconds to start up...");
                var runningScriptObj = new RunningScript(script, args);
                runningScriptObj.threads = threads;
                server.runningScripts.push(runningScriptObj);    //Push onto runningScripts
                addWorkerScript(runningScriptObj, server);
                return Promise.resolve(true);
            }
        }
    }
    workerScript.scriptRef.log("Could not find script " + scriptname + " on " + server.hostname);
    return Promise.resolve(false);
}

//Takes in a
function getErrorLineNumber(exp, workerScript) {
    var code = workerScript.scriptRef.scriptRef.code;

    //Split code up to the start of the node
    code = code.substring(0, exp.start);
    return (code.match(/\n/g) || []).length;
}

function isScriptErrorMessage(msg) {
    if (!isString(msg)) {return false;}
    let splitMsg = msg.split("|");
    if (splitMsg.length != 4){
        return false;
    }
    var ip = splitMsg[1];
    if (!isValidIPAddress(ip)) {
        return false;
    }
    return true;
}

//The same as Player's calculateHackingChance() function but takes in the server as an argument
function scriptCalculateHackingChance(server) {
    var difficultyMult = (100 - server.hackDifficulty) / 100;
    var skillMult = (1.75 * Player.hacking_skill) + (0.2 * Player.intelligence);
    var skillChance = (skillMult - server.requiredHackingSkill) / skillMult;
    var chance = skillChance * difficultyMult * Player.hacking_chance_mult;
    if (chance > 1) {return 1;}
    if (chance < 0) {return 0;}
    else {return chance;}
}

//The same as Player's calculateHackingTime() function but takes in the server as an argument
function scriptCalculateHackingTime(server) {
    var difficultyMult = server.requiredHackingSkill * server.hackDifficulty;
    var skillFactor = (2.5 * difficultyMult + 500) / (Player.hacking_skill + 50 + (0.1 * Player.intelligence));
    var hackingTime = 5 * skillFactor / Player.hacking_speed_mult; //This is in seconds
    return hackingTime;
}

//The same as Player's calculateExpGain() function but takes in the server as an argument
function scriptCalculateExpGain(server) {
    if (server.baseDifficulty == null) {
        server.baseDifficulty = server.hackDifficulty;
    }
    return (server.baseDifficulty * Player.hacking_exp_mult * 0.3 + 3) * BitNodeMultipliers.HackExpGain;
}

//The same as Player's calculatePercentMoneyHacked() function but takes in the server as an argument
function scriptCalculatePercentMoneyHacked(server) {
    var difficultyMult = (100 - server.hackDifficulty) / 100;
    var skillMult = (Player.hacking_skill - (server.requiredHackingSkill - 1)) / Player.hacking_skill;
    var percentMoneyHacked = difficultyMult * skillMult * Player.hacking_money_mult / 240;
    if (percentMoneyHacked < 0) {return 0;}
    if (percentMoneyHacked > 1) {return 1;}
    return percentMoneyHacked * BitNodeMultipliers.ScriptHackMoney;
}

//Amount of time to execute grow() in milliseconds
function scriptCalculateGrowTime(server) {
    var difficultyMult = server.requiredHackingSkill * server.hackDifficulty;
    var skillFactor = (2.5 * difficultyMult + 500) / (Player.hacking_skill + 50 + (0.1 * Player.intelligence));
    var growTime = 16 * skillFactor / Player.hacking_speed_mult; //This is in seconds
    return growTime * 1000;
}

//Amount of time to execute weaken() in milliseconds
function scriptCalculateWeakenTime(server) {
    var difficultyMult = server.requiredHackingSkill * server.hackDifficulty;
    var skillFactor = (2.5 * difficultyMult + 500) / (Player.hacking_skill + 50 + (0.1 * Player.intelligence));
    var weakenTime = 20 * skillFactor / Player.hacking_speed_mult; //This is in seconds
    return weakenTime * 1000;
}

export {makeRuntimeRejectMsg, netscriptDelay, runScriptFromScript,
        scriptCalculateHackingChance, scriptCalculateHackingTime,
        scriptCalculateExpGain, scriptCalculatePercentMoneyHacked,
        scriptCalculateGrowTime, scriptCalculateWeakenTime, evaluate,
        isScriptErrorMessage, killNetscriptDelay};
