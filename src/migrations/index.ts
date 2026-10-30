import * as migration_20261030_163605_initial_schema from './20261030_163605_initial_schema'
import * as migration_20261030_172533_cloud_storage_fields from './20261030_172533_cloud_storage_fields'
import * as migration_20261030_182451_optional_artwork_prices from './20261030_182451_optional_artwork_prices'
import * as migration_20261030_204249_artwork_materials from './20261030_204249_artwork_materials'

export const migrations = [
  {
    up: migration_20261030_163605_initial_schema.up,
    down: migration_20261030_163605_initial_schema.down,
    name: '20261030_163605_initial_schema',
  },
  {
    up: migration_20261030_172533_cloud_storage_fields.up,
    down: migration_20261030_172533_cloud_storage_fields.down,
    name: '20261030_172533_cloud_storage_fields',
  },
  {
    up: migration_20261030_182451_optional_artwork_prices.up,
    down: migration_20261030_182451_optional_artwork_prices.down,
    name: '20261030_182451_optional_artwork_prices',
  },
  {
    up: migration_20261030_204249_artwork_materials.up,
    down: migration_20261030_204249_artwork_materials.down,
    name: '20261030_204249_artwork_materials',
  },
]
