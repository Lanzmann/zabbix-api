const fs = require('fs').promises;

async function countObjectsInJsonFile() {
  const fileContent = await fs.readFile('helpers.json', 'utf8');
  const jsonArray = JSON.parse(fileContent);
  const count = jsonArray.length;
  console.log(count); // Outputs: number of objects in the JSON array
}

countObjectsInJsonFile();