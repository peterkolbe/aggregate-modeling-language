import { loadDrawIoFile } from './drawio-file-handler';

describe('loadDrawIoFile()', () => {
  it('should not throw an error', () => {
    const path = './drawio/analyses.aml.drawio';
    loadDrawIoFile(path);
    const diagram = {};
    // updateDiagramWithSchemaProperties(diagram);
    expect(1).toBe(1);
  });
});
