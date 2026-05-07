const KAKAO_MAP_KEY = (import.meta.env.VITE_KAKAO_MAP_KEY || "").trim();

const NAVER_DIRECTIONS_FALLBACK = "https://map.naver.com/p/directions";

export function buildNaverRouteUrl(originCoords, destinationCoords, destinationName) {
  if (!originCoords || !destinationCoords) {
    return NAVER_DIRECTIONS_FALLBACK;
  }

  const params = new URLSearchParams({
    slng: String(originCoords.lng),
    slat: String(originCoords.lat),
    stext: "내 위치",
    elng: String(destinationCoords.lng),
    elat: String(destinationCoords.lat),
    etext: destinationName || "도착지",
    pathType: "1",
    showMap: "true",
    menu: "route",
  });

  return `https://map.naver.com/index.nhn?${params.toString()}`;
}

export function buildNaverSearchUrl(keyword) {
  return `https://map.naver.com/p/search/${encodeURIComponent(keyword || "")}`;
}

export function loadKakaoMapSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve(window.kakao);
      return;
    }

    if (!KAKAO_MAP_KEY) {
      reject(new Error("VITE_KAKAO_MAP_KEY is not configured."));
      return;
    }

    const existingScript = document.getElementById("kakao-map-sdk");

    const onLoadKakao = () => {
      if (!window.kakao || !window.kakao.maps) {
        reject(new Error("Kakao map SDK did not load."));
        return;
      }

      window.kakao.maps.load(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          resolve(window.kakao);
        } else {
          reject(new Error("Kakao map services library did not load."));
        }
      });
    };

    if (existingScript) {
      existingScript.addEventListener("load", onLoadKakao, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Kakao map SDK load failed.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = onLoadKakao;
    script.onerror = () => reject(new Error("Kakao map SDK load failed."));

    document.head.appendChild(script);
  });
}

export async function resolvePlaceCoords(keyword) {
  const kakao = await loadKakaoMapSdk();
  const query = String(keyword || "").trim();

  if (!query) {
    throw new Error("Destination keyword is empty.");
  }

  const addressResult = await new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result.length > 0) {
        resolve(result[0]);
      } else {
        resolve(null);
      }
    });
  });

  if (addressResult) {
    return {
      lat: Number(addressResult.y),
      lng: Number(addressResult.x),
    };
  }

  const placeResult = await new Promise((resolve) => {
    const places = new kakao.maps.services.Places();
    places.keywordSearch(query, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result.length > 0) {
        resolve(result[0]);
      } else {
        resolve(null);
      }
    });
  });

  if (!placeResult) {
    throw new Error("Could not resolve destination coordinates.");
  }

  return {
    lat: Number(placeResult.y),
    lng: Number(placeResult.x),
  };
}

export function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => reject(new Error("Location permission was denied.")),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  });
}

export async function createRouteGuide(destination, knownDestinationCoords = null) {
  const destinationName = String(destination || "").trim();
  const originCoords = await getCurrentCoords();

  let destinationCoords = knownDestinationCoords;

  if (!destinationCoords) {
    try {
      destinationCoords = await resolvePlaceCoords(destinationName);
    } catch (error) {
      return {
        origin: `현재 위치 확인됨 (${originCoords.lat.toFixed(5)}, ${originCoords.lng.toFixed(5)})`,
        destination: destinationName,
        naverUrl: buildNaverSearchUrl(destinationName),
        status: "destination_failed",
        error: error?.message || "destination_failed",
      };
    }
  }

  return {
    origin: `현재 위치 확인됨 (${originCoords.lat.toFixed(5)}, ${originCoords.lng.toFixed(5)})`,
    destination: destinationName,
    destinationCoords: `${destinationCoords.lat.toFixed(5)}, ${destinationCoords.lng.toFixed(5)}`,
    naverUrl: buildNaverRouteUrl(originCoords, destinationCoords, destinationName),
    status: "ready",
  };
}
