// ウィンドウオブジェクトにカスタムプロパティを追加 - Adding custom property to window object
import type CameraControls from "camera-controls";

declare global {
  interface Window {
    cameraControls?: CameraControls | null;
    google?: typeof google;
  }

  namespace google {
    namespace maps {
      class Map {
        constructor(element: HTMLElement, options?: MapOptions);
        panTo(latLng: LatLngLiteral): void;
        setCenter(latLng: LatLngLiteral): void;
        setZoom(zoom: number): void;
      }

      interface MapOptions {
        center?: LatLngLiteral;
        zoom?: number;
        disableDefaultUI?: boolean;
        gestureHandling?: string;
        keyboardShortcuts?: boolean;
        mapTypeId?: string;
        styles?: MapTypeStyle[];
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      interface MapTypeStyle {
        elementType?: string;
        featureType?: string;
        stylers?: MapTypeStyler[];
      }

      interface MapTypeStyler {
        color?: string;
        visibility?: string;
        weight?: number;
        saturation?: number;
        lightness?: number;
      }
    }
  }
}

export {};