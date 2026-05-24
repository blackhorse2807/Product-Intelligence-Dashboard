import { Alert } from "../models/Alert.js";
import { SEVERITY } from "../utils/enums.js";

/**
 * Create seller alerts from validation issues (metadata only).
 */
export async function generateAlertsFromValidation(productId, validation) {
  if (!validation?.issues?.length) {
    return [];
  }

  const alerts = await Promise.all(
    validation.issues.map((issue) =>
      Alert.create({
        productId,
        severity: issue.severity || SEVERITY.MEDIUM,
        message: issue.message,
        resolved: false,
      })
    )
  );

  console.log(`[alerts] Generated ${alerts.length} alert(s) for product ${productId}`);
  return alerts;
}
