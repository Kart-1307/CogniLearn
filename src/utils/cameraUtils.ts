/**
 * Mobile-compatible Camera Access Utility
 * Provides robust fallbacks for iOS Safari, Android Chrome, and mobile webviews.
 */

export interface CameraDevice {
  deviceId: string;
  label: string;
}

/**
 * Requests camera stream with fallback constraint sets to ensure compatibility
 * across mobile browsers (iOS Safari, Android Chrome) and desktops.
 */
export async function getMobileCompatibleCameraStream(
  facingMode: 'user' | 'environment' = 'user',
  idealWidth: number = 640,
  idealHeight: number = 480,
  deviceId?: string
): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera access is not supported by your browser or secure context (HTTPS required).');
  }

  // Build list of constraint fallbacks
  const constraintList: MediaStreamConstraints[] = [];

  if (deviceId) {
    constraintList.push({
      video: { deviceId: { exact: deviceId }, width: { ideal: idealWidth }, height: { ideal: idealHeight } },
    });
    constraintList.push({
      video: { deviceId: deviceId },
    });
  }

  // Exact facing mode (preferred for front/back camera switch on smartphones)
  constraintList.push({
    video: {
      facingMode: { exact: facingMode },
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
    },
  });

  // Ideal facing mode
  constraintList.push({
    video: {
      facingMode: facingMode,
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
    },
  });

  constraintList.push({
    video: {
      facingMode: facingMode,
    },
  });

  // Alternate facing mode (e.g. if environment requested on a single-camera laptop/PC)
  const alternateFacingMode = facingMode === 'environment' ? 'user' : 'environment';
  constraintList.push({
    video: {
      facingMode: alternateFacingMode,
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
    },
  });

  constraintList.push({
    video: {
      facingMode: alternateFacingMode,
    },
  });

  // Generic fallback without facingMode
  constraintList.push({
    video: {
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
    },
  });

  constraintList.push({
    video: true,
  });

  constraintList.push({
    video: {},
  });

  let lastError: any = null;

  for (const constraints of constraintList) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream && stream.getVideoTracks().length > 0) {
        return stream;
      }
    } catch (err: any) {
      lastError = err;
      // Continue trying fallbacks
    }
  }

  const errName = lastError?.name || '';
  const errMsg = lastError?.message || String(lastError || '');

  if (
    errName === 'NotFoundError' ||
    errName === 'DevicesNotFoundError' ||
    errMsg.includes('Requested device not found') ||
    errMsg.includes('device not found') ||
    errMsg.includes('DevicesNotFoundError')
  ) {
    throw new Error('No camera device found on this system. Please connect a webcam or enable virtual camera.');
  }

  if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('Permission denied')) {
    throw new Error('Camera access permission was denied by browser settings.');
  }

  throw lastError || new Error('Could not access camera device.');
}

/**
 * Safely attaches a MediaStream to an HTMLVideoElement with all required mobile attributes.
 */
export async function attachStreamToVideo(
  videoElement: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  videoElement.srcObject = stream;
  videoElement.setAttribute('playsinline', 'true');
  videoElement.setAttribute('webkit-playsinline', 'true');
  videoElement.muted = true;
  videoElement.autoplay = true;

  try {
    await videoElement.play();
  } catch (err) {
    console.warn('Autoplay prevented or interrupted on mobile device:', err);
  }
}

/**
 * Enumerate available video input cameras (front, back, external USB, etc.)
 */
export async function getAvailableCameras(): Promise<CameraDevice[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === 'videoinput')
      .map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${index + 1}`,
      }));
  } catch (err) {
    console.warn('Failed to enumerate camera devices:', err);
    return [];
  }
}
