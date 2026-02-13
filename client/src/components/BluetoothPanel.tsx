import { type BluetoothState } from "@/hooks/use-bluetooth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bluetooth,
  BluetoothOff,
  Heart,
  Activity,
  Loader2,
  Unplug,
  AlertCircle,
} from "lucide-react";

function getHeartRateZone(hr: number): { label: string; color: string } {
  if (hr < 100) return { label: "Rest", color: "text-blue-400" };
  if (hr < 120) return { label: "Warm Up", color: "text-green-400" };
  if (hr < 140) return { label: "Fat Burn", color: "text-yellow-400" };
  if (hr < 160) return { label: "Cardio", color: "text-orange-400" };
  if (hr < 180) return { label: "Peak", color: "text-red-400" };
  return { label: "Max", color: "text-red-600" };
}

interface BluetoothPanelProps {
  bt: BluetoothState;
}

export function BluetoothConnectButton({ bt }: BluetoothPanelProps) {
  if (!bt.isSupported) return null;

  if (bt.isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={bt.disconnect}
        data-testid="button-bluetooth-disconnect"
      >
        <BluetoothOff className="w-4 h-4" />
        Disconnect
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={bt.connect}
      disabled={bt.isConnecting}
      data-testid="button-bluetooth-connect"
    >
      {bt.isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bluetooth className="w-4 h-4" />
      )}
      {bt.isConnecting ? "Connecting..." : "Connect Device"}
    </Button>
  );
}

export function BluetoothLiveCard({ bt }: BluetoothPanelProps) {
  if (!bt.isConnected) return null;

  if (bt.heartRate === null) {
    return (
      <Card className="border-border/50" data-testid="card-bluetooth-waiting">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium">{bt.deviceName}</span>
              <p className="text-xs text-muted-foreground">Connected - waiting for heart rate data...</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={bt.disconnect}
              data-testid="button-bluetooth-disconnect-waiting"
            >
              <Unplug className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const zone = getHeartRateZone(bt.heartRate);

  return (
    <Card className="border-primary/30" data-testid="card-bluetooth-live">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Heart className={`w-8 h-8 ${zone.color} animate-pulse`} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display tabular-nums" data-testid="text-heart-rate">
                  {bt.heartRate}
                </span>
                <span className="text-sm text-muted-foreground">bpm</span>
              </div>
              <Badge variant="outline" className={`text-xs no-default-active-elevate ${zone.color}`}>
                {zone.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {bt.avgHeartRate !== null && (
              <div className="text-center" data-testid="text-avg-hr">
                <div className="text-xs text-muted-foreground">Avg</div>
                <div className="font-semibold tabular-nums">{bt.avgHeartRate}</div>
              </div>
            )}
            {bt.maxHeartRate !== null && (
              <div className="text-center" data-testid="text-max-hr">
                <div className="text-xs text-muted-foreground">Max</div>
                <div className="font-semibold tabular-nums">{bt.maxHeartRate}</div>
              </div>
            )}
            {bt.minHeartRate !== null && (
              <div className="text-center" data-testid="text-min-hr">
                <div className="text-xs text-muted-foreground">Min</div>
                <div className="font-semibold tabular-nums">{bt.minHeartRate}</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="w-3 h-3" />
              {bt.deviceName}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={bt.disconnect}
              data-testid="button-bluetooth-disconnect-inline"
            >
              <Unplug className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BluetoothErrorBanner({ bt }: BluetoothPanelProps) {
  if (!bt.error) return null;

  return (
    <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="text-bluetooth-error">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{bt.error}</span>
    </div>
  );
}
