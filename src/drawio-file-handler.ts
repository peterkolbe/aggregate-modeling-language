import * as convert from 'xml-js';
import { ElementCompact } from 'xml-js';
import fs from 'fs';
import * as htmlEncoder from 'html-entities';
import { deflateRaw, inflateRaw } from 'pako';

// TODO: https://github.com/SciumoTech/mxgraphdata/blob/master/src/io.ts
// TODO: https://github.com/SciumoTech/mxgraphdata

export interface DiagramPage {
  id: string;
  name: string;
  diagram: ElementCompact;
}

export function loadDrawIoFile(path: string): Array<DiagramPage> {
  const xmfileXml: string = fs.readFileSync(path, 'utf8');
  const xmfileJs: ElementCompact = convert.xml2js(xmfileXml, { compact: true });

  const diagramContainer = xmfileJs.mxfile.diagram;
  let diagrams = [];
  if (!Array.isArray(diagramContainer)) {
    // only 1 page existing in the drawio diagram ==> put into array for further processing
    diagrams.push(diagramContainer);
  } else {
    diagrams = diagramContainer;
  }

  return diagrams.map((diagram: any) => {
    return {
      id: diagram._attributes.id,
      name: diagram._attributes.name,
      diagram: compressedXmlDiagram2jsDiagram(diagram),
    };
  });
}

export function updateDrawIoFile(updatedPages: Array<DiagramPage>, path: string): void {
  const xmFileXml: string = fs.readFileSync(path, 'utf8');
  const xmfileJs: ElementCompact = convert.xml2js(xmFileXml, { compact: true });

  const diagramContainer = xmfileJs.mxfile.diagram;
  let diagrams = [];
  if (!Array.isArray(diagramContainer)) {
    // only 1 page existing in the drawio diagram ==> put into array for further processing
    diagrams.push(diagramContainer);
  } else {
    diagrams = diagramContainer;
  }

  diagrams.forEach((diagram: any) => {
    const updatedPage = updatedPages.find((page) => page.id === diagram._attributes.id);
    if (!updatedPage) throw new Error(`Lost the page - ${diagram._attributes.name} - while processing the diagram!`);

    diagram._text = jsDiagram2compressedXmlDiagram(updatedPage.diagram);
  });

  const updatedXmfileXml = convert.js2xml(xmfileJs, {
    compact: true,
    spaces: 4,
    attributeValueFn: (val) => htmlEncoder.encode(val),
  });

  fs.writeFileSync(path, updatedXmfileXml, 'utf8');
}

function compressedXmlDiagram2jsDiagram(diagram: any): ElementCompact {
  if (!diagram._text) {
    throw new Error('diagram._text is empty, drawio file is corrupt.');
  }
  const data = Buffer.from(diagram._text, 'base64');
  const xml = inflateRaw(data, { to: 'string' });

  const decodedXml = decodeURIComponent(xml);
  return convert.xml2js(decodedXml, { compact: true });
}

export function jsDiagram2compressedXmlDiagram(diagram: ElementCompact): any {
  const xml = convert.js2xml(diagram, {
    compact: true,
    spaces: 4,
    attributeValueFn: (val) => htmlEncoder.encode(val),
  });

  const data = Buffer.from(xml);
  const deflated = deflateRaw(data, { to: 'string' });
  return Buffer.from(deflated).toString('base64');
}
