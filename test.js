const ZabbixSender = require('node-zabbix-sender');
const cron = require('node-cron');

async function sendZabbixData() {
  const zabbixSender = new ZabbixSender({ host: '192.169.200.66' });
  const data = 
    {
      host: '192.169.200.201',
      key: 'fail',
      value: 1
    }

  console.log(zabbixSender)

  zabbixSender.addItem(data.host, data.key, data.value)

  await zabbixSender.send((err, res) => {
    console.log('Sending data to Zabbix...');
    if (err) {
      console.error('Failed to send data to Zabbix:', err);
    } else {
      console.log('Data sent successfully:', res);
    }
  })
}

// Schedule the cron job to run every 60 seconds
cron.schedule('*/30 * * * * *', () => {
  console.log('Running cron job...')
  sendZabbixData()
});
