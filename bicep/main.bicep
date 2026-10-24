targetScope = 'subscription'

param resourceGroupName string = 'rg-bicep-demo-prod'
param location string = 'eastus'

resource newRG 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: {
    Ambiente: 'Pruebas'
    Herramienta: 'Bicep'
  }
}
