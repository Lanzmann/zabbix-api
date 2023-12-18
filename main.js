import zabbixPromise from "zabbix-promise";
import { stringify } from 'csv'
import { Stringifier } from 'csv-stringify'
import fs from 'fs'
import { readFile } from 'fs/promises'

const zabbix = new zabbixPromise({
  url: 'http://192.169.0.4/zabbix/api_jsonrpc.php',
  user: 'Admin',
  password: '80A1f5451f@z'
});

async function getHosts(prefix) {
  try {
    await zabbix.login()
    const response = await zabbix.request('host.get', {
      search: {
        name: prefix
      },
      selectGroups: 'extend', // get the groups the host belongs to
      output: ['hostid', 'host', 'name']
    });
    //console.log(response)
    return response || []
  } catch (err) {
    console.error(err)
  }
}

async function updateHostNames(hosts, prefix, groupName) {
  try {
    const promises = hosts.map(host => {
      // const belongsToGroup = host.groups.some(group => group.name.includes(groupName))
      //if (belongsToGroup) {
      const newHostName = host.host.replace(prefix, '').trim()
      return zabbix.request('host.update', {
        hostid: host.hostid,
        host: newHostName,
        name: host.name
      })
    }
    )
    const responses = await Promise.all(promises)
    console.log(responses)
  } catch (err) {
    console.error(err)
  }
}

function generateCsvString(hostList) {
  return new Promise((resolve, reject) => {
    stringify(hostList, {
      header: true,
      columns: ['old host name', 'new host name', 'group name'],
    }, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
}

async function generateCsvReport(hosts, prefix, groupName) {
  const processedHostList = hosts.map(host => {
    const groupNames = host.groups.map(group => group.name); // get the names of all groups
    //const belongsToGroup = host.groups.some(group => group.name.includes(groupName));
    //if (belongsToGroup) {
    const newHostName = host.host.replace(prefix, '').trim(); // remove the prefix and trim whitespace
    return {
      'old host name': host.host,
      'new host name': newHostName,
      'group name': groupNames.join('/')
    };
  }
  ).filter(Boolean);
  const csvString = await generateCsvString(processedHostList);
  console.log(csvString);  // Add this line

  // const day = String(date.getDate()).padStart(2, '0');
  // const month = String(date.getMonth() + 1).padStart(2, '0');
  // const year = date.getFullYear();

  // const filename = `report_${day}_${month}_${year}.csv`;

  fs.writeFile('report.csv', csvString, (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('CSV report saved as report.csv');
    }
  });

  return csvString;
}

async function updateHostInventory(hosts) {
  try {
    const promises = hosts.map(host => {
      if (host.hostid && host.latitude && host.longitude) {
        return zabbix.request('host.massupdate', {
          hosts: [{ hostid: host.hostid }],
          inventory_mode: 0,
          inventory: {
            location_lat: host.latitude,
            location_lon: host.longitude
          }
        })
      }
    })
    const responses = await Promise.all(promises)
    console.log(responses)
  } catch (err) {
    console.error(err)
  }
}

async function main(prefix) {
  const hosts = await getHosts(prefix)
  const hostsData = JSON.parse(await readFile('helpers.json', 'utf8'))
  const hostsToUpdate = hostsData.map(data => {
    const host = hosts.find(h => h.host === data.ip)
    if (host) {
      return {
        ...host,
        latitude: data.latitude,
        longitude: data.longitude
      }
    }
  }).filter(Boolean)

  await updateHostInventory(hostsToUpdate)
  await generateCsvReport(hosts, prefix)
  //await updateHostNames(hosts, prefix)
}

main('TOTEM - NUC - ')