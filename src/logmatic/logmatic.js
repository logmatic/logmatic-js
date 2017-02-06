import LogmaticBuilder from "./logmatic-builder"

var logger = LogmaticBuilder()
  .init("PpxV3zcuR4eV9kLgcvetuw")
  .withName("awesome")
  .setCustomConfiguration({
    client: {
      IPTracking: false,
      UATracking: true,
      bulkLingerMs: 1000,
      uaTrackingAttributeName: "client_ip"
    }
  })
  .build();


logger.log("end of the world", {"pouet": "pia"});
logger.info("end of the world", {"pouet": "pia"});
logger.warn("end of the world", {"pouet": "pia"});
logger.error("end of the world", {"pouet": "pia"});

console.log("from console");
console.warn("from console");
console.info("from console");
