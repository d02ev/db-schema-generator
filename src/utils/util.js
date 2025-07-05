import { DATATYPE_MAPPING } from './constants.js';

export const simplifyType = dataType => {
  if (dataType in DATATYPE_MAPPING) {
    return DATATYPE_MAPPING[dataType];
  }
  return dataType;
};

export const convertTableNamesToArray = tablesNames => {
  if (tablesNames.length > 1) {
    return tablesNames.split(',').map(table => table.trim());
  }
  return [tablesNames.trim()];
};
