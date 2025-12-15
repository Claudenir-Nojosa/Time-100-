// src/lib/pythonRuntime.js
let executionCount = 1;
const executionHistory = {};

export async function runPythonCode(code, cellId = null) {
  const currentCount = executionCount++;

  if (cellId) {
    executionHistory[cellId] = currentCount;
  }

  // Simular diferentes tipos de output baseado no código
  if (code.includes("import pandas") || code.includes("pd.")) {
    return await simulatePandasOutput(code, currentCount);
  }

  if (code.includes("import numpy") || code.includes("np.")) {
    return await simulateNumpyOutput(code, currentCount);
  }

  if (code.includes("plt.") || code.includes("import matplotlib")) {
    return await simulateMatplotlibOutput(code, currentCount);
  }

  return await simulateGenericOutput(code, currentCount);
}

async function simulatePandasOutput(code, count) {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return `In [${count}]: ${code.split("\n")[0]}
   ...: ${code.split("\n").slice(1).join("\n   ...: ")}
Out[${count}]:
Dataset shape: (10000, 15)

          price    area  bedrooms  bathrooms
count  10000.0  9995.0   10000.0    9998.0
mean   645231.5  125.5       3.0       2.5
std    144337.7   28.9       1.0       1.1
min    350000.0   50.0       1.0       1.0
25%    522500.0  106.2       2.0       2.0
50%    645000.0  125.5       3.0       2.0
75%    767500.0  144.8       4.0       3.0
max    940000.0  200.0       5.0       4.0

[5 rows x 15 columns]`;
}

async function simulateNumpyOutput(code, count) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return `In [${count}]: ${code}
Out[${count}]:
array([ 2,  4,  6,  8, 10])

Mean: 6.0
Std: 2.828
Min: 2, Max: 10`;
}

// Função para obter o histórico de execução
export function getExecutionHistory() {
  return executionHistory;
}

// Resetar contador
export function resetExecutionCounter() {
  executionCount = 1;
  Object.keys(executionHistory).forEach((key) => {
    delete executionHistory[key];
  });
}
