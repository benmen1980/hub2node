// services/priority.service.js
const request = require('request');

const updatePriorityOrder = (username, password,orderId, orderStatus) => {
    return new Promise((resolve, reject) => {
        const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

        const options = {
            method: 'PATCH',
            url: `https://prioritydev4.simplyct.co.il/odata/Priority/tabula.ini/demo/ORDERS('${orderId}')`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                ORDSTATUSDES: orderStatus || 'מאושרת לבצוע'
            })
        };

        request(options, (error, response, body) => {
            if (error) return reject(error);

            const status = response.statusCode;

            if (status >= 400) {
                return reject(new Error(`Priority API Error: ${status} - ${body}`));
            }

            try {
                const result = JSON.parse(body);
                return resolve(result);
            } catch (err) {
                return reject(new Error(`Failed to parse response: ${body}`));
            }
        });
    });
};

module.exports = {
    updatePriorityOrder
};
