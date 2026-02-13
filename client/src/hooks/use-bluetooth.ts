import { useState, useEffect, useCallback, useRef } from "react";

const HEART_RATE_SERVICE = "heart_rate";
const HEART_RATE_MEASUREMENT = "heart_rate_measurement";

export interface BluetoothState {
  isSupported: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  deviceName: string | null;
  heartRate: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  minHeartRate: number | null;
  sessionHeartRates: number[];
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  resetSession: () => void;
}

function parseHeartRate(value: DataView): number {
  const flags = value.getUint8(0);
  const is16Bit = flags & 0x01;
  if (is16Bit) {
    return value.getUint16(1, true);
  }
  return value.getUint8(1);
}

export function useBluetoothHeartRate(): BluetoothState {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [sessionHeartRates, setSessionHeartRates] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const disconnectHandlerRef = useRef<(() => void) | null>(null);

  const isSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  const avgHeartRate = sessionHeartRates.length > 0
    ? Math.round(sessionHeartRates.reduce((a, b) => a + b, 0) / sessionHeartRates.length)
    : null;

  const maxHeartRate = sessionHeartRates.length > 0
    ? Math.max(...sessionHeartRates)
    : null;

  const minHeartRate = sessionHeartRates.length > 0
    ? Math.min(...sessionHeartRates)
    : null;

  const handleHRNotification = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target.value) {
      const hr = parseHeartRate(target.value);
      if (hr > 0 && hr < 250) {
        setHeartRate(hr);
        setSessionHeartRates(prev => [...prev, hr]);
      }
    }
  }, []);

  const cleanupDevice = useCallback(() => {
    if (characteristicRef.current) {
      try {
        characteristicRef.current.removeEventListener("characteristicvaluechanged", handleHRNotification);
        characteristicRef.current.stopNotifications().catch(() => {});
      } catch {}
      characteristicRef.current = null;
    }

    if (deviceRef.current) {
      if (disconnectHandlerRef.current) {
        deviceRef.current.removeEventListener("gattserverdisconnected", disconnectHandlerRef.current);
        disconnectHandlerRef.current = null;
      }
      if (deviceRef.current.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
      deviceRef.current = null;
    }
  }, [handleHRNotification]);

  const connect = useCallback(async () => {
    if (!isSupported) {
      setError("Bluetooth is not supported in this browser. Try Chrome on Android, macOS, or Windows.");
      return;
    }

    cleanupDevice();
    setIsConnecting(true);
    setError(null);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [HEART_RATE_SERVICE] },
        ],
        optionalServices: ["battery_service"],
      });

      deviceRef.current = device;
      setDeviceName(device.name || "Unknown Device");

      const onDisconnect = () => {
        setIsConnected(false);
        setHeartRate(null);
        setDeviceName(null);
        characteristicRef.current = null;
      };
      disconnectHandlerRef.current = onDisconnect;
      device.addEventListener("gattserverdisconnected", onDisconnect);

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(HEART_RATE_SERVICE);
      const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);

      characteristicRef.current = characteristic;

      characteristic.addEventListener("characteristicvaluechanged", handleHRNotification);
      await characteristic.startNotifications();

      setIsConnected(true);
    } catch (err: any) {
      if (err.name === "NotFoundError") {
        setError("No compatible heart rate device found nearby. Make sure your device is on and in pairing mode.");
      } else if (err.name === "SecurityError") {
        setError("Bluetooth permission denied. Please allow Bluetooth access.");
      } else if (err.message?.includes("User cancelled")) {
        setError(null);
      } else {
        setError(err.message || "Failed to connect to device.");
      }
      setDeviceName(null);
    } finally {
      setIsConnecting(false);
    }
  }, [isSupported, handleHRNotification, cleanupDevice]);

  const disconnect = useCallback(() => {
    cleanupDevice();
    setIsConnected(false);
    setHeartRate(null);
    setDeviceName(null);
  }, [cleanupDevice]);

  const resetSession = useCallback(() => {
    setSessionHeartRates([]);
  }, []);

  useEffect(() => {
    return () => {
      cleanupDevice();
    };
  }, [cleanupDevice]);

  return {
    isSupported,
    isConnecting,
    isConnected,
    deviceName,
    heartRate,
    avgHeartRate,
    maxHeartRate,
    minHeartRate,
    sessionHeartRates,
    error,
    connect,
    disconnect,
    resetSession,
  };
}
