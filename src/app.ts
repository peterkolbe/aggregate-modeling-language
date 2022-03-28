import log from 'loglevel';
import { DiagramPage, loadDrawIoFile, updateDrawIoFile } from './drawio-file-handler';
import { updateDiagramPagesWithSchemas } from './diagram-manipulator';
import { apiInputConfigurations } from './api-input-configurations';

log.setDefaultLevel('info');
log.info('### Start');

const drawIoFilePath = './drawio/analyses.aml.drawio';
const diagramPages: DiagramPage[] = loadDrawIoFile(drawIoFilePath);

apiInputConfigurations.forEach((apiDefinition) => {
  updateDiagramPagesWithSchemas(diagramPages, apiDefinition);
});

updateDrawIoFile(diagramPages, drawIoFilePath);
