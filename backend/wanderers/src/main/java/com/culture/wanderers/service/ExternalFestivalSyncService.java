package com.culture.wanderers.service;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class ExternalFestivalSyncService {

    private final TourApiFestivalService tourApiFestivalService;
    private final GyeonggiDataDreamService gyeonggiDataDreamService;
    private final CultureDataPortalFestivalService cultureDataPortalFestivalService;
    private final KopisFestivalService kopisFestivalService;

    public ExternalFestivalSyncService(
            TourApiFestivalService tourApiFestivalService,
            GyeonggiDataDreamService gyeonggiDataDreamService,
            CultureDataPortalFestivalService cultureDataPortalFestivalService,
            KopisFestivalService kopisFestivalService
    ) {
        this.tourApiFestivalService = tourApiFestivalService;
        this.gyeonggiDataDreamService = gyeonggiDataDreamService;
        this.cultureDataPortalFestivalService = cultureDataPortalFestivalService;
        this.kopisFestivalService = kopisFestivalService;
    }

    public Map<String, Object> syncAll(int limitPerSource) {
        int safeLimit = Math.min(Math.max(limitPerSource, 1), 300);
        Map<String, Object> result = new LinkedHashMap<>();
        SyncResult tourApi = safeSync(() -> tourApiFestivalService.syncUpcoming(safeLimit));
        SyncResult gyeonggiData = safeSync(() -> gyeonggiDataDreamService.syncUpcoming(safeLimit));
        SyncResult cultureData = safeSync(() -> cultureDataPortalFestivalService.syncUpcoming(safeLimit));
        SyncResult kopis = safeSync(() -> kopisFestivalService.syncUpcoming(safeLimit));

        result.put("tourApi", tourApi.count());
        result.put("gyeonggiData", gyeonggiData.count());
        result.put("cultureData", cultureData.count());
        result.put("kopis", kopis.count());
        result.put("total", tourApi.positiveCount() + gyeonggiData.positiveCount() + cultureData.positiveCount() + kopis.positiveCount());
        result.put("errors", Map.of(
                "tourApi", tourApi.error(),
                "gyeonggiData", gyeonggiData.error(),
                "cultureData", cultureData.error(),
                "kopis", kopis.error()
        ));
        return result;
    }

    private SyncResult safeSync(SyncTask task) {
        try {
            return new SyncResult(task.run(), "");
        } catch (Exception e) {
            return new SyncResult(-1, e.getClass().getSimpleName() + ": " + String.valueOf(e.getMessage()));
        }
    }

    @FunctionalInterface
    private interface SyncTask {
        int run();
    }

    private record SyncResult(int count, String error) {
        int positiveCount() {
            return Math.max(count, 0);
        }
    }
}
