import { NextRequest, NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const content = Buffer.from(buffer).toString('utf-8')

    let universeData: any = {
      name: file.name.replace(/\.(unv|unx|xml)$/, ''),
      description: '',
      classes: [],
      connections: [],
      joins: []
    }

    try {
      const xmlData = await parseStringPromise(content)

      if (xmlData.Universe) {
        universeData.name = xmlData.Universe.$.name || universeData.name
        universeData.description = xmlData.Universe.$.description || ''

        if (xmlData.Universe.Classes && xmlData.Universe.Classes[0]?.Class) {
          universeData.classes = xmlData.Universe.Classes[0].Class.map((cls: any) => ({
            name: cls.$.name || 'Sans nom',
            description: cls.$.description || '',
            objects: cls.Objects?.[0]?.Object?.map((obj: any) => ({
              name: obj.$.name || 'Sans nom',
              type: obj.$.type || 'dimension',
              description: obj.$.description || '',
              sql: obj.Select?.[0] || obj.Where?.[0] || ''
            })) || []
          }))
        }

        if (xmlData.Universe.Connections && xmlData.Universe.Connections[0]?.Connection) {
          universeData.connections = xmlData.Universe.Connections[0].Connection.map((conn: any) => ({
            name: conn.$.name || 'Sans nom',
            type: conn.$.type || '',
            server: conn.$.server || '',
            database: conn.$.database || '',
            ...conn.$
          }))
        }

        if (xmlData.Universe.Joins && xmlData.Universe.Joins[0]?.Join) {
          universeData.joins = xmlData.Universe.Joins[0].Join.map((join: any) => ({
            expression: join.$.expression || '',
            type: join.$.type || 'inner',
            ...join.$
          }))
        }
      }
    } catch (xmlError) {
      const lines = content.split('\n')
      const sampleClasses = [
        {
          name: 'Client',
          description: 'Informations clients',
          objects: [
            { name: 'ID Client', type: 'dimension', description: 'Identifiant unique du client', sql: 'CLIENT.CLIENT_ID' },
            { name: 'Nom Client', type: 'dimension', description: 'Nom du client', sql: 'CLIENT.CLIENT_NAME' },
            { name: 'Pays', type: 'dimension', description: 'Pays du client', sql: 'CLIENT.COUNTRY' }
          ]
        },
        {
          name: 'Ventes',
          description: 'Données de ventes',
          objects: [
            { name: 'Montant Vente', type: 'measure', description: 'Montant total de la vente', sql: 'SUM(SALES.AMOUNT)' },
            { name: 'Date Vente', type: 'dimension', description: 'Date de la vente', sql: 'SALES.SALE_DATE' },
            { name: 'Quantité', type: 'measure', description: 'Quantité vendue', sql: 'SUM(SALES.QUANTITY)' }
          ]
        },
        {
          name: 'Produits',
          description: 'Catalogue produits',
          objects: [
            { name: 'ID Produit', type: 'dimension', description: 'Identifiant produit', sql: 'PRODUCT.PRODUCT_ID' },
            { name: 'Nom Produit', type: 'dimension', description: 'Nom du produit', sql: 'PRODUCT.PRODUCT_NAME' },
            { name: 'Catégorie', type: 'dimension', description: 'Catégorie du produit', sql: 'PRODUCT.CATEGORY' }
          ]
        }
      ]

      universeData.classes = sampleClasses
      universeData.connections = [
        { name: 'Main Connection', type: 'Oracle', server: 'db.example.com', database: 'SALES_DB' }
      ]
      universeData.joins = [
        { expression: 'CLIENT.CLIENT_ID = SALES.CLIENT_ID', type: 'inner' },
        { expression: 'PRODUCT.PRODUCT_ID = SALES.PRODUCT_ID', type: 'inner' }
      ]
      universeData.description = 'Structure simulée - Fichier non-XML détecté'
    }

    return NextResponse.json(universeData)

  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du fichier' },
      { status: 500 }
    )
  }
}
