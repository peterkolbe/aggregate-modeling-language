import { ElementCompact } from 'xml-js';
import log from 'loglevel';
import { isEmpty } from 'lodash';
import { OpenAPIV3 } from 'openapi-types';
import * as htmlEncoder from 'html-entities';
import { DiagramPage } from './drawio-file-handler';
import { loadOpenAPIV3Document } from './openapi';
import ReferenceObject = OpenAPIV3.ReferenceObject;
import SchemaObject = OpenAPIV3.SchemaObject;
import ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
import { ApiInputConfiguration } from './api-input-configuration.type';

const AML_NODE_LAYER_LABEL = 'model';
const AML_NODE_TYPE_TAG_NAME = 'amlNodeType';
const AML_NODE_TYPE_AGGREGATE_ROOT = 'aggregateRoot';
const AML_NODE_TYPE_ENTITY = 'entity';
const AML_NODE_TYPE_VALUE_OBJECT = 'valueObject';
const AML_NODE_TYPE_REPOSITORY = 'repository';
const AML_NODE_TYPE_COMMON_AGGREGATE_ROOT = 'commonAggregateRoot';
const AML_NODE_TYPE_COMMON_ENTITY = 'commonEntity';
const AML_NODE_TYPE_COMMON_VALUE_OBJECT = 'commonValueObject';

const AML_CONNECTION_TYPE_TAG_NAME = 'amlConnectionType';
const AML_CONNECTION_TYPE_IS_A = 'isA';
const AML_CONNECTION_TYPE_HAS = 'has';
const AML_CONNECTION_TYPE_REFERENCES = 'references';

const AML_NODE_CHILD_ELEMENT_TYPE_TAG_NAME = 'amlNodeChildElementType';
const AML_NODE_CHILD_ELEMENT_TYPE_ATTRIBUTES = 'attributes';
const AML_NODE_CHILD_ELEMENT_TYPE_COMMANDS = 'commands';

const PROPERTIES_BOX_COLLAPSED_WIDTH = 160;
const PROPERTIES_BOX_HEIGHT_OFFSET = 14;
const PROPERTY_HEIGHT = 14.4;
const PROPERTY_WIDTH = 300;

const ELEMENTS_WITH_PROPERTIES_COLLAPSED_BOX_OFFSET = 12;
const ELEMENTS_WITH_PROPERTIES_COLLAPSED_BOX_LINE_HEIGHT = 14;

const nodeTypes = [
  AML_NODE_TYPE_AGGREGATE_ROOT,
  AML_NODE_TYPE_ENTITY,
  AML_NODE_TYPE_VALUE_OBJECT,
  AML_NODE_TYPE_COMMON_AGGREGATE_ROOT,
  AML_NODE_TYPE_COMMON_ENTITY,
  AML_NODE_TYPE_COMMON_VALUE_OBJECT,
];

function getNodesForSchema(
  schemaName: string,
  pageName: string,
  pageDiagramRoot: ElementCompact,
  apiDefinition: ApiInputConfiguration
): Array<any> {
  const nodes = pageDiagramRoot.object.filter(
    (object: any) =>
      nodeTypes.includes(object._attributes[AML_NODE_TYPE_TAG_NAME]) &&
      withoutWhitespacesAndLinebreaks(object._attributes['label']) === schemaName
  );

  if (nodes.length < 1 && apiDefinition && pageName === apiDefinition.drawIoPageName) {
    log.warn(`${pageName} : No diagram element found for Schema - ${schemaName} - ==> skipping this element.`);
  }
  return nodes;
}

function getAttributesObject(elementWithProperties: any, attributesObjects: any) {
  const parentElementId = elementWithProperties._attributes.id;
  const foundAttributesObjects = attributesObjects.filter(
    (attributesObject: any) => attributesObject.mxCell._attributes.parent === parentElementId
  );
  if (foundAttributesObjects.length !== 1) {
    throw new Error(
      'Did NOT find exactly one attributes object for element with label: ' +
        withoutWhitespacesAndLinebreaks(elementWithProperties._attributes.label) +
        ' ==> Remove / Add an attributes box to this element and check whether it is a direct child of it!'
    );
  }
  return foundAttributesObjects[0];
}

function setSizeOfNode(
  propertiesAsString: string,
  elementWithProperties: any,
  attributesObject: any,
  schemaName: string
) {
  const numberOfProps = (propertiesAsString.match(/<br>/g) || []).length + 1;
  const newPropertiesHeight: number = PROPERTIES_BOX_HEIGHT_OFFSET + Math.ceil(numberOfProps * PROPERTY_HEIGHT);

  let collapsedElementWithProperties = elementWithProperties.mxCell.mxGeometry.mxRectangle;
  let expandedElementWithProperties = elementWithProperties.mxCell.mxGeometry;

  if (Boolean(elementWithProperties.mxCell._attributes.collapsed)) {
    collapsedElementWithProperties = elementWithProperties.mxCell.mxGeometry;
    expandedElementWithProperties = elementWithProperties.mxCell.mxGeometry.mxRectangle;
  }

  const amountOfLinesInCollapsedElementWithProperties =
    (elementWithProperties._attributes.label.match(/<br>/g) || []).length + 1;
  const collapsedElementWithPropertiesHeight =
    ELEMENTS_WITH_PROPERTIES_COLLAPSED_BOX_OFFSET +
    Math.ceil(amountOfLinesInCollapsedElementWithProperties * ELEMENTS_WITH_PROPERTIES_COLLAPSED_BOX_LINE_HEIGHT);

  const elementWithPropertiesStyle: string = elementWithProperties.mxCell._attributes.style;
  const startSizeRegEx = /(startSize=)\d*;/g;
  const newStartSizeString = 'startSize=' + collapsedElementWithPropertiesHeight + ';';
  elementWithProperties.mxCell._attributes.style = elementWithPropertiesStyle.replace(
    startSizeRegEx,
    newStartSizeString
  );
  collapsedElementWithProperties._attributes.height = '' + collapsedElementWithPropertiesHeight;
  collapsedElementWithProperties._attributes.width = '' + PROPERTIES_BOX_COLLAPSED_WIDTH;

  const expandedElementWithPropertiesHeight = collapsedElementWithPropertiesHeight + newPropertiesHeight;

  attributesObject.mxCell.mxGeometry._attributes.height = '' + newPropertiesHeight;
  attributesObject.mxCell.mxGeometry._attributes.width = '' + PROPERTY_WIDTH;

  // FIXME: calculate and set height and width of commands

  expandedElementWithProperties._attributes.height = '' + expandedElementWithPropertiesHeight;

  expandedElementWithProperties._attributes.width = '' + PROPERTY_WIDTH;

  log.debug(
    `Set ${schemaName} box sizes: [ collapsedHeight = ${collapsedElementWithPropertiesHeight}, collapsedWidth = ${PROPERTIES_BOX_COLLAPSED_WIDTH} ] - [ expandedHeight = ${expandedElementWithPropertiesHeight}, expandedWidth = ${PROPERTY_WIDTH} ].`
  );
}

function updateNode(
  schemaName: string,
  propertiesAsString: string,
  diagramPage: ElementCompact,
  apiDefinition: ApiInputConfiguration
) {
  const diagramPageRoot: ElementCompact = diagramPage.diagram.mxGraphModel.root;
  const nodes = getNodesForSchema(schemaName, diagramPage.name, diagramPageRoot, apiDefinition);
  const attributesObjects = diagramPageRoot.object.filter(
    (obj: any) => obj._attributes[AML_NODE_CHILD_ELEMENT_TYPE_TAG_NAME] === AML_NODE_CHILD_ELEMENT_TYPE_ATTRIBUTES
  );

  nodes.forEach((node: any) => {
    const attributesObject: any = getAttributesObject(node, attributesObjects);
    attributesObject._attributes.label = propertiesAsString;
    log.info(`${diagramPage.name} : Writing properties to schema - ${schemaName} - | ${propertiesAsString}`);

    setSizeOfNode(propertiesAsString, node, attributesObject, schemaName);
  });
}

function handleArray(
  nonRefSchema: OpenAPIV3.ArraySchemaObject | OpenAPIV3.NonArraySchemaObject,
  propertyNamePart: string
) {
  const arraySchema = nonRefSchema as ArraySchemaObject;
  if (isReferenceObject(arraySchema.items)) return '';
  const nonRefArrayItems = arraySchema.items as SchemaObject;
  return propertyNamePart + `[ ${nonRefArrayItems.type} ]`;
}

function getNodeAttributesString(apiPropertyName: string, apiPropertySchema: SchemaObject | ReferenceObject): string {
  if (isReferenceObject(apiPropertySchema)) return '';

  const propertyNamePart = `${apiPropertyName}: `;
  const nonRefSchema = apiPropertySchema as SchemaObject;

  if (isArraySchemaObject(nonRefSchema)) {
    return handleArray(nonRefSchema, propertyNamePart);
  }

  if (!nonRefSchema.type) throw new Error(`The schema - ${apiPropertyName} has no defined type!`);
  if (nonRefSchema.type !== 'string') return propertyNamePart + nonRefSchema.type;
  if (nonRefSchema.enum) {
    return propertyNamePart + `Enum <br>&nbsp;&nbsp;- ${nonRefSchema.enum.join('<br>&nbsp;&nbsp;- ')}`;
  }
  if (!Boolean(nonRefSchema.format)) return propertyNamePart + nonRefSchema.type;
  const formatTypesToDisplayInsteadOfString = ['date', 'date-time', 'password', 'byte', 'binary'];
  return formatTypesToDisplayInsteadOfString.includes(nonRefSchema.format || '')
    ? propertyNamePart + nonRefSchema.format
    : propertyNamePart + nonRefSchema.type;
}

function isReferenceObject(schema: ReferenceObject | SchemaObject): boolean {
  return '$ref' in schema;
}

function isArraySchemaObject(schema: SchemaObject): boolean {
  return 'items' in schema;
}

function getProperties(schema: ReferenceObject | SchemaObject): { [name: string]: ReferenceObject | SchemaObject } {
  if (isReferenceObject(schema)) return {};
  return (schema as SchemaObject).properties || {};
}

function isEnumSchema(apiSchema: SchemaObject): boolean {
  const a = apiSchema.type === 'string' && Boolean(apiSchema.enum);
  return apiSchema.type === 'string' && Boolean(apiSchema.enum);
}

function getPropertiesAsAggregatedString(schema: ReferenceObject | SchemaObject): string {
  const NO_PROPERTIES_RESULT_STRING = 'no own properties';
  if (isReferenceObject(schema)) return NO_PROPERTIES_RESULT_STRING;
  const nonRefSchema = schema as SchemaObject;
  if (isEnumSchema(nonRefSchema)) return getNodeAttributesString('', nonRefSchema);

  const schemaProperties = getProperties(schema);
  const result = Object.entries(schemaProperties)
    .map(([propertyName, propertySchema]) => getNodeAttributesString(propertyName, propertySchema))
    .filter((attributeString) => !isEmpty(attributeString))
    .join('<br>');
  return isEmpty(result) ? NO_PROPERTIES_RESULT_STRING : result;
}

export function updateDiagramPagesWithSchemas(diagramPages: Array<DiagramPage>, apiDefinition: ApiInputConfiguration) {
  const api = loadOpenAPIV3Document(apiDefinition.openApiFilePath);

  const schemas = api.components?.schemas || {};
  log.info(`\n----------------> Updating pages with schemas from API - ${api.info.title} -\n`);

  Object.entries(schemas).forEach(([schemaName, schema]) => {
    diagramPages.forEach((diagramPage) => {
      const propertiesString = getPropertiesAsAggregatedString(schema);
      updateNode(schemaName, propertiesString, diagramPage, apiDefinition);
    });
  });

  return diagramPages;
}

function withoutWhitespacesAndLinebreaks(label: string): string {
  return htmlEncoder
    .decode(label || '')
    .replace(/\<br>/g, '')
    .replace(/\<br\>/g, '')
    .replace(/\<br\s\/>/g, '')
    .replace(/\s+/g, '')
    .replace(/(\r\n|\n|\r)/gm, '');
}
