/*jshint esversion: 6 */
const express = require('express');
const morgan = require('morgan');
const app = express();
var NodeAE = require('iot-application-services-sdk-nodejs');
var cfenv = require('cfenv');

var appEnv = cfenv.getAppEnv();

var nodeAE = new NodeAE(
		{
			clientId : appEnv.getService('sca-iotae').credentials.clientId,
			clientSecret : appEnv.getService('sca-iotae').credentials.clientSecret,
			tenant : appEnv.getService('sca-iotae').credentials.tenant,
			landscape : appEnv.getService('sca-iotae').credentials.landscape,
			host : appEnv.getService('sca-iotae').credentials.host

		});


//nodeAE.setBaseUrl('appiot-mds')
const basicAuth = require('basic-auth');
const auth = function(req, res, next) {
	console.log('Authorization');
	function unauthorized(res) {
		res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
		return res.sendStatus(401);
	}


	var user = basicAuth(req);

	if (!user || !user.name || !user.pass) {
		return unauthorized(res);
	}


	if (user.name === 'test' && user.pass === 'test') {
		return next();
	} else {
		return unauthorized(res);
	}

};

app.use(morgan('tiny'));// For Logging
const port = process.env.PORT || 8080;// listener.address().port;

var listener = app.listen(port, function() {
	console.log('Listening on port ' + port + '!');//
});

//app.get('/', auth, function(req, res) {
app.get('/*',auth ,async (req, res, next) => {

var requestUrl = req.originalUrl;
	try {
		var nodeProxy;
		if (requestUrl.substring(0,4) == '/pxs'){
			nodeProxy = nodeAE;//nodeCF;
			requestUrl = requestUrl.slice(4);
		} else{
			nodeProxy = nodeAE;
		}
		var microservice = requestUrl.split('/')[1];// get Microservice
		var resourcePath = requestUrl.replace('/'+microservice, '');
		nodeProxy.setBaseUrl(microservice);
		console.log(nodeProxy.getBaseUrl());		
		const response = await nodeProxy.request(resourcePath);
		await console.log('Success');
		await res.send(response);
		/*
		 * await response.then(function success(stream) { console.log('First request
		 * completed - Success'); stream.pipe(res) }, function error(err) {
		 * console.log('First request completed - Error'); console.error(err) });
		 */


	} catch (err) {
		console.error('ERROR' + ' - ' + err.message);
		await res.send(err.message);
	}


});