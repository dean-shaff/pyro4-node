net = require("net")

const client = net.createConnection({ port: 50001 }, () => {
    var data = {"handshake": "hello", "object": "BasicServer"};
    var dataSqr = {"object": "BasicServer", "params": [100], "method": "square", "kwargs": {}}
    var dataJSON = JSON.stringify(data);
    var dataSqrJSON = JSON.stringify(dataSqr);
    console.log(dataJSON);
    msg = new message.Message(message.MSG_CONNECT, dataJSON, message.FLAGS_META_ON_CONNECT, 0);
    msgSqr = new message.Message(message.MSG_INVOKE,dataSqrJSON, 0, 0);
    var writeResp1 = client.write(msg.toBytes());
    var writeResp2 = client.write(msgSqr.toBytes());
    console.log("Response: {}, {}".format(writeResp1, writeResp2))
});

client.on('data', (data) => {
    var msgs = message.Message.recv(data);
})

client.on('drain', () => {
    console.log("Drained.")
})

client.on('end', () => {
    console.log('Disconnected from server');
});
