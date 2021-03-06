/**
 * Metadata for constructing Location objects for all Locations
 * in the game
 */
import { IConstructorParams } from "../Location";
import { LocationType } from "../LocationTypeEnum";
import { CityName } from "./CityNames";
import { LocationName } from "./LocationNames";

export const LocationsMetadata: IConstructorParams[] = [
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue:  32,
            difficulty: 4.4,
            maxClearanceLevel: 50,
            startingSecurityLevel: 1350,
        },
        name: LocationName.AevumAeroCorp,
        types: [LocationType.Company],
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue: 42,
            difficulty: 4.1,
            maxClearanceLevel: 60,
            startingSecurityLevel: 1350,
        },
        name: LocationName.AevumBachmanAndAssociates,
        types: [LocationType.Company],
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue:  34,
            difficulty: 3.6,
            maxClearanceLevel: 75,
            startingSecurityLevel: 1800,
        },
        name: LocationName.AevumClarkeIncorporated,
        types: [LocationType.Company],
    },
    {
        city: CityName.Aevum,
        costMult: 3,
        expMult: 2,
        name: LocationName.AevumCrushFitnessGym,
        types: [LocationType.Gym],
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue: 116,
            difficulty: 6,
            maxClearanceLevel: 150,
            startingSecurityLevel: 4800,
        },
        name: LocationName.AevumECorp,
        types: [LocationType.Company, LocationType.TechVendor],
        techVendorMaxRam: 512,
        techVendorMinRam: 128,
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue:  96,
            difficulty: 6.2,
            maxClearanceLevel: 100,
            startingSecurityLevel: 4140,
        },
        name: LocationName.AevumFulcrumTechnologies,
        types: [LocationType.Company, LocationType.TechVendor],
        techVendorMaxRam: 1024,
        techVendorMinRam: 256,
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue: 30,
            difficulty: 3.95,
            maxClearanceLevel: 50,
            startingSecurityLevel: 1260,
        },
        name: LocationName.AevumGalacticCybersystems,
        types: [LocationType.Company],
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue: 10,
            difficulty: 1.4,
            maxClearanceLevel: 25,
            startingSecurityLevel: 144,
        },
        name: LocationName.AevumNetLinkTechnologies,
        types: [LocationType.Company, LocationType.TechVendor],
        techVendorMaxRam: 64,
        techVendorMinRam: 8,
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue: 18,
            difficulty: 2.2,
            maxClearanceLevel: 25,
            startingSecurityLevel: 565,
        },
        name: LocationName.AevumPolice,
        types: [LocationType.Company],
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue: 16,
            difficulty: 1.9,
            maxClearanceLevel: 20,
            startingSecurityLevel: 485,
        },
        name: LocationName.AevumRhoConstruction,
        types: [LocationType.Company],
    },
    {
        city: CityName.Aevum,
        costMult: 10,
        expMult: 5,
        name: LocationName.AevumSnapFitnessGym,
        types: [LocationType.Gym],
    },
    {
        city: CityName.Aevum,
        costMult: 4,
        expMult: 3,
        name: LocationName.AevumSummitUniversity,
        types: [LocationType.University],
    },
    {
        city: CityName.Aevum,
        infiltrationData: {
            baseRewardValue: 20,
            difficulty: 3,
            maxClearanceLevel: 30,
            startingSecurityLevel: 690,
        },
        name: LocationName.AevumWatchdogSecurity,
        types: [LocationType.Company],
    },
    {
        city: CityName.Chongqing,
        infiltrationData: {
            baseRewardValue: 100,
            difficulty: 6.1,
            maxClearanceLevel: 100,
            startingSecurityLevel: 4450,
        },
        name: LocationName.ChongqingKuaiGongInternational,
        types: [LocationType.Company],
    },
    {
        city: CityName.Chongqing,
        infiltrationData: {
            baseRewardValue: 52,
            difficulty: 6,
            maxClearanceLevel: 75,
            startingSecurityLevel: 2915,
        },
        name: LocationName.ChongqingSolarisSpaceSystems,
        types: [LocationType.Company],
    },
    {
        city: CityName.Ishima,
        infiltrationData: {
            baseRewardValue: 20,
            difficulty: 3.2,
            maxClearanceLevel: 50,
            startingSecurityLevel: 485,
        },
        name: LocationName.IshimaNovaMedical,
        types: [LocationType.Company],
    },
    {
        city: CityName.Ishima,
        infiltrationData: {
            baseRewardValue: 10,
            difficulty: 1.6,
            maxClearanceLevel: 40,
            startingSecurityLevel: 130,
        },
        name: LocationName.IshimaOmegaSoftware,
        types: [LocationType.Company, LocationType.TechVendor],
        techVendorMaxRam: 128,
        techVendorMinRam: 4,
    },
    {
        city: CityName.Ishima,
        infiltrationData: {
            baseRewardValue: 24,
            difficulty: 4.1,
            maxClearanceLevel: 100,
            startingSecurityLevel: 570,
        },
        name: LocationName.IshimaStormTechnologies,
        types: [LocationType.Company, LocationType.TechVendor],
        techVendorMaxRam: 512,
        techVendorMinRam: 32,
    },
    {
        city: CityName.NewTokyo,
        infiltrationData: {
            baseRewardValue: 28,
            difficulty: 4,
            maxClearanceLevel: 70,
            startingSecurityLevel: 1050,
        },
        name: LocationName.NewTokyoDefComm,
        types: [LocationType.Company],
    },
    {
        city: CityName.NewTokyo,
        infiltrationData: {
            baseRewardValue: 24,
            difficulty: 3.8,
            maxClearanceLevel: 80,
            startingSecurityLevel: 700,
        },
        name: LocationName.NewTokyoGlobalPharmaceuticals,
        types: [LocationType.Company],
    },
    {
        city: CityName.NewTokyo,
        name: LocationName.NewTokyoNoodleBar,
        types: [LocationType.Company],
    },
    {
        city: CityName.NewTokyo,
        infiltrationData: {
            baseRewardValue: 22,
            difficulty: 3.5,
            maxClearanceLevel: 100,
            startingSecurityLevel: 605,
        },
        name: LocationName.NewTokyoVitaLife,
        types: [LocationType.Company, LocationType.Special],
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 14,
            difficulty: 2.25,
            maxClearanceLevel: 40,
            startingSecurityLevel: 200,
        },
        name: LocationName.Sector12AlphaEnterprises,
        types: [LocationType.Company, LocationType.TechVendor],
        techVendorMaxRam: 8,
        techVendorMinRam: 2,
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 46,
            difficulty: 4.2,
            maxClearanceLevel: 100,
            startingSecurityLevel: 2160,
        },
        name: LocationName.Sector12BladeIndustries,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        name: LocationName.Sector12CIA,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 18,
            difficulty: 2.5,
            maxClearanceLevel: 60,
            startingSecurityLevel: 405,
        },
        name: LocationName.Sector12CarmichaelSecurity,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        name: LocationName.Sector12CityHall,
        types: [LocationType.Special],
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 24,
            difficulty: 4.3,
            maxClearanceLevel: 50,
            startingSecurityLevel: 700,
        },
        name: LocationName.Sector12DeltaOne,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        name: LocationName.Sector12FoodNStuff,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 58,
            difficulty: 7,
            maxClearanceLevel: 100,
            startingSecurityLevel: 1350,
        },
        name: LocationName.Sector12FourSigma,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 32,
            difficulty: 5.4,
            maxClearanceLevel: 70,
            startingSecurityLevel: 730,
        },
        name: LocationName.Sector12IcarusMicrosystems,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        expMult: 1,
        costMult: 1,
        name: LocationName.Sector12IronGym,
        types: [LocationType.Gym],
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 8,
            difficulty: 1.8,
            maxClearanceLevel: 20,
            startingSecurityLevel: 120,
        },
        name: LocationName.Sector12JoesGuns,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 114,
            difficulty: 6.75,
            maxClearanceLevel: 125,
            startingSecurityLevel: 4500,
        },
        name: LocationName.Sector12MegaCorp,
        types: [LocationType.Company],
    },
    {
        city: CityName.Sector12,
        name: LocationName.Sector12NSA,
        types: [LocationType.Company, LocationType.Special],
    },
    {
        city: CityName.Sector12,
        costMult: 20,
        expMult: 10,
        name: LocationName.Sector12PowerhouseGym,
        types: [LocationType.Gym],
    },
    {
        city: CityName.Sector12,
        costMult: 3,
        expMult: 2,
        name: LocationName.Sector12RothmanUniversity,
        types: [LocationType.University],
    },
    {
        city: CityName.Sector12,
        infiltrationData: {
            baseRewardValue: 24,
            difficulty: 4.3,
            maxClearanceLevel: 50,
            startingSecurityLevel: 700,
        },
        name: LocationName.Sector12UniversalEnergy,
        types: [LocationType.Company],
    },
    {
        city: CityName.Volhaven,
        infiltrationData: {
            baseRewardValue: 12,
            difficulty: 2.1,
            maxClearanceLevel: 60,
            startingSecurityLevel: 195,
        },
        name: LocationName.VolhavenCompuTek,
        types: [LocationType.Company, LocationType.TechVendor],
        techVendorMaxRam: 256,
        techVendorMinRam: 8,
    },
    {
        city: CityName.Volhaven,
        infiltrationData: {
            baseRewardValue: 28,
            difficulty: 3,
            maxClearanceLevel: 75,
            startingSecurityLevel: 1080,
        },
        name: LocationName.VolhavenHeliosLabs,
        types: [LocationType.Company],
    },
    {
        city: CityName.Volhaven,
        infiltrationData: {
            baseRewardValue: 14,
            difficulty: 2,
            maxClearanceLevel: 60,
            startingSecurityLevel: 340,
        },
        name: LocationName.VolhavenLexoCorp,
        types: [LocationType.Company],
    },
    {
        city: CityName.Volhaven,
        costMult: 7,
        expMult: 4,
        name: LocationName.VolhavenMilleniumFitnessGym,
        types: [LocationType.Gym],
    },
    {
        city: CityName.Volhaven,
        infiltrationData: {
            baseRewardValue: 56,
            difficulty: 6.8,
            maxClearanceLevel: 200,
            startingSecurityLevel: 1460,
        },
        name: LocationName.VolhavenNWO,
        types: [LocationType.Company],
    },
    {
        city: CityName.Volhaven,
        infiltrationData: {
            baseRewardValue: 44,
            difficulty: 4.4,
            maxClearanceLevel: 100,
            startingSecurityLevel: 1215,
        },
        name: LocationName.VolhavenOmniTekIncorporated,
        types: [LocationType.Company, LocationType.TechVendor],
        techVendorMaxRam: 1024,
        techVendorMinRam: 128,
    },
    {
        city: CityName.Volhaven,
        infiltrationData: {
            baseRewardValue: 28,
            difficulty: 4.9,
            maxClearanceLevel: 90,
            startingSecurityLevel: 725,
        },
        name: LocationName.VolhavenOmniaCybersystems,
        types: [LocationType.Company],
    },
    {
        city: CityName.Volhaven,
        infiltrationData: {
            baseRewardValue: 18,
            difficulty: 2.4,
            maxClearanceLevel: 75,
            startingSecurityLevel: 430,
        },
        name: LocationName.VolhavenSysCoreSecurities,
        types: [LocationType.Company],
    },
    {
        city: CityName.Volhaven,
        costMult: 5,
        expMult: 4,
        name: LocationName.VolhavenZBInstituteOfTechnology,
        types: [LocationType.University],
    },
    {
        city: null,
        name: LocationName.Hospital,
        types: [LocationType.Hospital],
    },
    {
        city: null,
        name: LocationName.Slums,
        types: [LocationType.Slums],
    },
    {
        city: null,
        name: LocationName.TravelAgency,
        types: [LocationType.TravelAgency],
    },
    {
        city: null,
        name: LocationName.WorldStockExchange,
        types: [LocationType.StockMarket],
    },
];
