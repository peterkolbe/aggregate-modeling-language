import { ApiInputConfiguration } from "./api-input-configuration.type";

export const apiInputConfigurations: ApiInputConfiguration[] = [
    {
        drawIoPageName: 'commons',
        openApiFilePath: './openapi/commons.yml',
        isCommon: true,
    },
    {
        drawIoPageName: 'corporates-analyses',
        openApiFilePath: './openapi/corporates-analyses.yml',
        isCommon: false,
    },
    {
        drawIoPageName: 'asset-analyses-structured-finance',
        openApiFilePath: './openapi/asset-analyses-structured-finance.yml',
        isCommon: false,
    },
    {
        drawIoPageName: 'analyses',
        openApiFilePath: './openapi/analyses.yml',
        isCommon: false,
    },
];