const protobuf = require('protobufjs')

function convertEnumToString (
  { value, key, NFTMeta, locale }
  ) {
    let result = value;
    try {
      const options = NFTMeta?.fields[key]?.resolvedType?.options[value];
      const translationObject = JSON.parse(options);
  
      if (translationObject && translationObject[locale]) {
        result = translationObject[locale];
      }
    } catch (e) {
      console.log(
        "Error parsing schema when trying to convert enum to string: ",
        e
      );
    }  
    return result;
}

function getProtoBufRoot ( schema ) {
  let result = null;
  try {
    if ( schema ) {      
      const source = JSON.parse(schema);
      if ( typeof source === 'object' ) {
        if ( 'onChainMetaData' in source?.nested) {
          result = protobuf.Root.fromJSON( source );          
        }
      }
    }
    return result;  
  } catch { 
    return null;
  }  
}


function deserializeNFT ({
  buffer, locale, root, metaKey = 'onChainMetaData.NFTMeta', schema
}) {  
  // Obtain the message type
  const NFTMeta = root.lookupType(metaKey);
  // Decode a Uint8Array (browser) or Buffer (node) to a message
  const message = NFTMeta.decode(buffer);
  const originalObject = NFTMeta.toObject(message);
  const parseObject = NFTMeta.toObject(message, {
    enums: String, // enums as string names
    longs: String, // longs as strings (requires long.js)
    bytes: Array, // bytes as base64 encoded strings
    defaults: true, // includes default values
    arrays: true, // populates empty arrays (repeated fields) even if defaults=false
    objects: true, // populates empty objects (map fields) even if defaults=false
    oneofs: true,
  });

  const mappingObject = Object.fromEntries(
    Object.keys(originalObject).map((key) => [key, parseObject[key]])
  );
  for (const key in mappingObject) {
    if (NFTMeta.fields[key].resolvedType === null) {
      continue;
    }
    if (NFTMeta.fields[key].resolvedType.constructor.name == "Enum") {
      if (Array.isArray(mappingObject[key])) {
        const items = mappingObject[key];
        items.forEach((item, index) => {          
          mappingObject[key][index] = convertEnumToString({
            value: mappingObject[key][index],
            key,
            NFTMeta,
            locale
          });
        });
      } else {        
        mappingObject[key] = convertEnumToString({
          value: mappingObject[key],
          key,
          NFTMeta,
          locale
        });
      }
    }
  }
  return mappingObject;
}

module.exports = Object.freeze({
  getProtoBufRoot,
  deserializeNFT  
});