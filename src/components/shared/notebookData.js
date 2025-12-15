// components/notebook/notebookData.js
export const cellsData = [
  {
    id: 'cell1',
    type: 'markdown',
    content: '# Análise Exploratória de Dados\n## Dataset: Preços de Imóveis',
    executionCount: null,
    isExecuted: true
  },
  {
    id: 'cell2',
    type: 'code',
    content: `import pandas as pd
import matplotlib.pyplot as plt

# Carregar dados
df = pd.read_csv('data/imoveis.csv')
print(f"Dataset shape: {df.shape}")
print(df.head())`,
    output: `Dataset shape: (10000, 15)
   price  area  bedrooms  bathrooms
0  750000  120         3          2
1  620000  100         2          1
2  890000  150         4          3
3  540000   80         2          1
4  950000  180         4          4`,
    executionCount: 1,
    isExecuted: true
  },
  {
    id: 'cell3',
    type: 'code',
    content: `# Estatísticas descritivas
print(df.describe())

# Valores nulos
print(f"\\nValores nulos por coluna:")
print(df.isnull().sum())`,
    output: `            price          area     bedrooms   bathrooms
count  10000.000000  10000.000000  10000.00000  10000.00000
mean   645231.500000    125.500000      3.00000      2.50000
std    144337.654283     28.867513      1.00000      1.11803
min    350000.000000     50.000000      1.00000      1.00000
25%    522500.000000    106.250000      2.00000      2.00000
50%    645000.000000    125.500000      3.00000      2.00000
75%    767500.000000    144.750000      4.00000      3.00000
max    940000.000000    200.000000      5.00000      4.00000

Valores nulos por coluna:
price        0
area         5
bedrooms     0
bathrooms    2`,
    executionCount: 2,
    isExecuted: true
  }
]