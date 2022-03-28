import { OpenAPIV3 } from 'openapi-types';
import * as yaml from 'js-yaml';
import fs from 'fs';

export function loadOpenAPIV3Document(path: string): OpenAPIV3.Document {
  return yaml.load(fs.readFileSync(path, 'utf8')) as OpenAPIV3.Document;
}
