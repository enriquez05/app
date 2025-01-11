
export let currentDevice = null;
export let printCharacteristic = null;
// sharedState.js


// Utility: Update the status message on the page
export function updateStatus(message) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
}

export async function reconnectToBluetoothDevice(deviceInfo) {
    try {
        // Request the stored Bluetooth device by its ID
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ deviceId: deviceInfo.id }]
        });
                
        console.log(`Reconnected to device: ${device.name}`);
        currentDevice = device;
        updateStatus(`Reconnected to: ${device.name}`);

        // Establish the GATT connection as before
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
            if (characteristic.properties.write) {
                printCharacteristic = characteristic;
                break;
            }
        }

        if (!printCharacteristic) {
            updateStatus('Writable characteristic for printing not found.');
            return;
        }

    } catch (error) {
        console.error('Error reconnecting to Bluetooth device:', error);
        updateStatus(`Failed to reconnect to printer: ${error.message}`);
    }
}


export async function connectToBluetoothPrinter() {
    try {
        let printerDevice = currentDevice;

        // Check if a device is already stored
        if (!printerDevice) {
            printerDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb']
            });

            console.log(`Connected to device: ${printerDevice.name}`);
            currentDevice = printerDevice; // Store the device globally
            sessionStorage.setItem('bluetoothDeviceId', printerDevice.id); // Save device ID
        }

        // Check if GATT connection is active
        let server = printerDevice.gatt.connected
            ? printerDevice.gatt
            : await printerDevice.gatt.connect();

        updateStatus('GATT server connected.');

        // Get the printer service
        const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
        console.log('Found printer service:', service);

        // Find the writable characteristic
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
            if (characteristic.properties.write) {
                printCharacteristic = characteristic;
                console.log('Writable characteristic found:', characteristic.uuid);
                break;
            }
        }

        if (!printCharacteristic) {
            updateStatus('Writable characteristic for printing not found.');
            return;
        }

        updateStatus(`Connected to: ${printerDevice.name}`);
    } catch (error) {
        console.error('Error connecting to Bluetooth printer:', error);
        updateStatus(`Failed to connect to printer: ${error.message}`);
    }
}

export async function reconnectAutomatically() {
    const deviceId = sessionStorage.getItem('bluetoothDeviceId');
    if (!deviceId) {
        console.log('No saved device to reconnect.');
        return;
    }

    try {
        // Request the saved device without user interaction
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ deviceId }],
            optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb']
        });

        console.log(`Reconnected to device: ${device.name}`);
        currentDevice = device;

        // Reconnect to the GATT server
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
        const characteristics = await service.getCharacteristics();

        for (const characteristic of characteristics) {
            if (characteristic.properties.write) {
                printCharacteristic = characteristic;
                console.log('Writable characteristic found:', characteristic.uuid);
                break;
            }
        }

        if (!printCharacteristic) {
            updateStatus('Writable characteristic not found.');
            return;
        }

        updateStatus(`Reconnected to: ${device.name}`);
    } catch (error) {
        console.error('Error reconnecting to Bluetooth device:', error);
        updateStatus(`Failed to reconnect: ${error.message}`);
    }
}
