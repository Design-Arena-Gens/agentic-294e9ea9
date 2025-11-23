'use client'

import { useState } from 'react'
import styles from './page.module.css'

interface UniverseObject {
  name: string
  type: string
  description?: string
  sql?: string
}

interface UniverseClass {
  name: string
  description?: string
  objects: UniverseObject[]
}

interface UniverseData {
  name: string
  description?: string
  classes: UniverseClass[]
  connections: any[]
  joins: any[]
}

export default function Home() {
  const [universeData, setUniverseData] = useState<UniverseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'classes' | 'connections' | 'joins'>('classes')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse-universe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du parsing du fichier')
      }

      const data = await response.json()
      setUniverseData(data)
      if (data.classes.length > 0) {
        setSelectedClass(data.classes[0].name)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          📊 Business Objects Universe Reader
        </h1>
        <p className={styles.description}>
          Téléchargez un fichier univers (.unv, .unx) pour analyser sa structure
        </p>

        <div className={styles.uploadSection}>
          <label htmlFor="file-upload" className={styles.uploadButton}>
            {loading ? 'Chargement...' : 'Choisir un fichier'}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".unv,.unx,.xml"
            onChange={handleFileUpload}
            disabled={loading}
            className={styles.fileInput}
          />
        </div>

        {error && (
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {universeData && (
          <div className={styles.results}>
            <div className={styles.header}>
              <h2>{universeData.name}</h2>
              {universeData.description && (
                <p className={styles.subtitle}>{universeData.description}</p>
              )}
            </div>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'classes' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('classes')}
              >
                Classes ({universeData.classes.length})
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'connections' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('connections')}
              >
                Connexions ({universeData.connections.length})
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'joins' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('joins')}
              >
                Jointures ({universeData.joins.length})
              </button>
            </div>

            <div className={styles.content}>
              {activeTab === 'classes' && (
                <div className={styles.classesView}>
                  <div className={styles.classList}>
                    {universeData.classes.map((cls) => (
                      <div
                        key={cls.name}
                        className={`${styles.classItem} ${selectedClass === cls.name ? styles.selectedClass : ''}`}
                        onClick={() => setSelectedClass(cls.name)}
                      >
                        <strong>{cls.name}</strong>
                        <span className={styles.badge}>{cls.objects.length}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.objectsPanel}>
                    {selectedClass && universeData.classes.find(c => c.name === selectedClass) && (
                      <>
                        <h3>{selectedClass}</h3>
                        {universeData.classes.find(c => c.name === selectedClass)?.description && (
                          <p className={styles.classDescription}>
                            {universeData.classes.find(c => c.name === selectedClass)?.description}
                          </p>
                        )}
                        <div className={styles.objectsList}>
                          {universeData.classes.find(c => c.name === selectedClass)?.objects.map((obj, idx) => (
                            <div key={idx} className={styles.objectCard}>
                              <div className={styles.objectHeader}>
                                <strong>{obj.name}</strong>
                                <span className={styles.objectType}>{obj.type}</span>
                              </div>
                              {obj.description && (
                                <p className={styles.objectDescription}>{obj.description}</p>
                              )}
                              {obj.sql && (
                                <pre className={styles.sqlCode}>{obj.sql}</pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'connections' && (
                <div className={styles.listView}>
                  {universeData.connections.map((conn, idx) => (
                    <div key={idx} className={styles.card}>
                      <h3>{conn.name || `Connexion ${idx + 1}`}</h3>
                      {Object.entries(conn).map(([key, value]) => (
                        <div key={key} className={styles.property}>
                          <span className={styles.propertyKey}>{key}:</span>
                          <span className={styles.propertyValue}>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'joins' && (
                <div className={styles.listView}>
                  {universeData.joins.map((join, idx) => (
                    <div key={idx} className={styles.card}>
                      <h3>Jointure {idx + 1}</h3>
                      {Object.entries(join).map(([key, value]) => (
                        <div key={key} className={styles.property}>
                          <span className={styles.propertyKey}>{key}:</span>
                          <span className={styles.propertyValue}>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
