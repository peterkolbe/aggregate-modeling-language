import log from 'loglevel';
import { DiagramPage, loadDrawIoFile, updateDrawIoFile } from './drawio-file-handler';
import { updateDiagramPagesWithSchemas } from './diagram-manipulator';

log.setDefaultLevel('info');
log.info('### Start');

export interface ApiDefinition {
  drawIoPageName: string;
  openApiFilePath: string;
  isCommon: boolean;
}

const drawIoFilePath = './drawio/analyses.aml.drawio';
const diagramPages: Array<DiagramPage> = loadDrawIoFile(drawIoFilePath);

const apiDefinitions: Array<ApiDefinition> = [
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

apiDefinitions.forEach((apiDefinition) => {
  updateDiagramPagesWithSchemas(diagramPages, apiDefinition);
});

updateDrawIoFile(diagramPages, drawIoFilePath);
