import { DiagramPage, loadDrawIoFile } from './drawio-file-handler';

let convert = require('xml-js');
let fs = require('fs');
jest.mock('fs');

describe('loadDrawIoFile()', () => {
  const emptyDrawIoFileContentSingleDiagram =
    '<mxfile><diagram id="first-diagram-id" name="Seite-1">dZHBEoIgEIafhrvCZHY2q0snD50Z2YQZdBmk0Xr6dJCMsU4s3/4/y+4SVrTj2XIjryhAE5qIkbAjoTRN0nw6ZvL0JNsxDxqrxCJaQaVeEJwLfSgBfSR0iNopE8Mauw5qFzFuLQ6x7I46rmp4AxtQ1Vxv6U0JJz3N6X7lF1CNDJXT7OAzLQ/ipZNecoHDF2IlYYVFdD5qxwL0PLwwF+87/cl+Pmahcz8MU7C+PV2iDbHyDQ==</diagram></mxfile>';
  const emptyDrawIoFileContentTwoDiagrams =
    '<mxfile><diagram id="first-diagram-id" name="Seite-1">dZHBEoIgEIafhrvCZHY2q0snD50Z2YQZdBmk0Xr6dJCMsU4s3/4/y+4SVrTj2XIjryhAE5qIkbAjoTRN0nw6ZvL0JNsxDxqrxCJaQaVeEJwLfSgBfSR0iNopE8Mauw5qFzFuLQ6x7I46rmp4AxtQ1Vxv6U0JJz3N6X7lF1CNDJXT7OAzLQ/ipZNecoHDF2IlYYVFdD5qxwL0PLwwF+87/cl+Pmahcz8MU7C+PV2iDbHyDQ==</diagram><diagram id="second-diagram-id" name="Seite-2">dZHBEoIgEIafhrvCZHY2q0snD50Z2YQZdBmk0Xr6dJCMsU4s3/4/y+4SVrTj2XIjryhAE5qIkbAjoTRN0nw6ZvL0JNsxDxqrxCJaQaVeEJwLfSgBfSR0iNopE8Mauw5qFzFuLQ6x7I46rmp4AxtQ1Vxv6U0JJz3N6X7lF1CNDJXT7OAzLQ/ipZNecoHDF2IlYYVFdD5qxwL0PLwwF+87/cl+Pmahcz8MU7C+PV2iDbHyDQ==</diagram></mxfile>';

  it('should throw error on empty input', () => {
    expect(() => loadDrawIoFile('')).toThrowError('path must not be empty');
  });

  it('should read file content', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    fs.readFileSync.mockReturnValue(emptyDrawIoFileContentSingleDiagram);
    loadDrawIoFile('someFile');

    expect(readFileSpy).toHaveBeenCalledWith('someFile', 'utf8');
    expect(readFileSpy).toHaveBeenCalledTimes(1);
  });

  it('should pass fileContent to xml2js', () => {
    fs.readFileSync.mockReturnValue(emptyDrawIoFileContentSingleDiagram);
    const xml2jsSpy = jest.spyOn(convert, 'xml2js');

    loadDrawIoFile('someFile');

    expect(xml2jsSpy).toHaveBeenCalledTimes(2);
    expect(xml2jsSpy).toHaveBeenNthCalledWith(1, emptyDrawIoFileContentSingleDiagram, { compact: true });
  });

  it('should handle single diagram (page)', () => {
    fs.readFileSync.mockReturnValue(emptyDrawIoFileContentSingleDiagram);

    const actual = loadDrawIoFile('someFile');

    expect(actual).toBeTruthy();
    expect(actual.length).toEqual(1);
  });

  it('should handle multiple diagrams (pages)', () => {
    fs.readFileSync.mockReturnValue(emptyDrawIoFileContentTwoDiagrams);

    const actual = loadDrawIoFile('someFile');

    expect(actual).toBeTruthy();
    expect(actual.length).toEqual(2);
  });

  describe('diagram attributes', () => {
    let actual: DiagramPage[];

    beforeEach(() => {
      fs.readFileSync.mockReturnValue(emptyDrawIoFileContentTwoDiagrams);
      actual = loadDrawIoFile('someFile');
    });

    it('should set id', () => {
      expect(actual[0].id).toEqual('first-diagram-id');
      expect(actual[1].id).toEqual('second-diagram-id');
    });

    it('should set name', () => {
      expect(actual[0].name).toEqual('Seite-1');
      expect(actual[1].name).toEqual('Seite-2');
    });

    it('should set diagram', () => {
      // TODO  - müssten wir noch mehr testen
      const diagram1 = actual[0].diagram;
      expect(diagram1.mxGraphModel).toBeTruthy();
      expect(diagram1.mxGraphModel.root).toBeTruthy();

      const diagram2 = actual[1].diagram;
      expect(diagram2.mxGraphModel).toBeTruthy();
      expect(diagram2.mxGraphModel.root).toBeTruthy();
    });
  });
});

describe('updateDrawIoFile', () => {});
