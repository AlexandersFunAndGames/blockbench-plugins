import armorTemplate from './armorTemplate.json';

const makeOptions = arr => Object.fromEntries(arr.map(x => [x, x]));

export const MOD_SDK_1_15_FORGE = 'Forge 1.12 - 1.16';
export const MOD_SDK_1_15_FABRIC = 'Fabric 1.15 - 1.16';
export const MOD_SDKS = [MOD_SDK_1_15_FORGE, MOD_SDK_1_15_FABRIC];
export const MOD_SDK_OPTIONS = makeOptions(MOD_SDKS);

export const OBJ_TYPE_ENTITY = 'OBJ_TYPE_ENTITY';
export const OBJ_TYPE_ARMOR = 'OBJ_TYPE_ARMOR';
export const OBJ_TYPE_BLOCK_ITEM = 'OBJ_TYPE_ITEM_BLOCK';
export const OBJ_TYPE_OPTIONS = {
  [OBJ_TYPE_ENTITY]: 'Entity/Block/Item',
  [OBJ_TYPE_ARMOR]: 'Armor',
  [OBJ_TYPE_BLOCK_ITEM]: 'Block/Item', //Will be deprecated in the future, kept to kept existing bbmodels working. Merged into OBJ_TYPE_ENTITY
};

export const AZURELIB_SETTINGS_DEFAULT = {
  formatVersion: 2,
  modSDK: MOD_SDK_1_15_FORGE,
  objectType: OBJ_TYPE_ENTITY,
  entityType: 'Entity/Block/Item',
  javaPackage: 'com.example.mod',
  animFileNamespace: 'MODID',
  animFilePath: 'animations/ANIMATIONFILE.json',
};
Object.freeze(AZURELIB_SETTINGS_DEFAULT);

let azurelibSettings = Object.assign({}, AZURELIB_SETTINGS_DEFAULT);

export function onSettingsChanged() {
  Modes.selected.select();
  switch(azurelibSettings.objectType) {
    case OBJ_TYPE_ARMOR: {
      if(Outliner.root.length === 0) {
        Codecs.project.parse(armorTemplate);
      } else {
        alert('Unable to load Armor Template as this would overwrite the current model. Please select Armor type on an empty project if you want to use the Armor Template.');
      }
      break;
    } case OBJ_TYPE_BLOCK_ITEM: {
      Project.parent = 'builtin/entity';
      break;
    }
  }
}

export default azurelibSettings;