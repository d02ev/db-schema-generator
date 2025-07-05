import { DATATYPE_MAPPING } from './constants.js';

export const simplifyType = dataType => {
  if (dataType in DATATYPE_MAPPING) {
    return DATATYPE_MAPPING[dataType];
  }
  return dataType;
};
