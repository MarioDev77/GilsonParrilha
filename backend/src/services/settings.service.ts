import { AppError } from '../errors/app-error';
import { settingsRepository } from '../repositories/settings.repository';
import { isOpenAt, parseOpeningHours } from '../utils/business-hours';

export const settingsService = {
  // Somente o que o site precisa. Nada administrativo (ids, datas de atualização etc.).
  async getPublic() {
    const s = await settingsRepository.get();
    if (!s) throw AppError.unavailable('Loja ainda não configurada');

    const openingHours = parseOpeningHours(s.openingHours);
    return {
      tradeName: s.tradeName,
      whatsappNumber: s.whatsappNumber,
      address: s.address,
      openingHours,
      timezone: s.timezone,
      isOpenNow: isOpenAt(openingHours, s.timezone),
      acceptOrdersOutsideHours: s.acceptOrdersOutsideHours,
      acceptsDelivery: s.acceptsDelivery,
      acceptsPickup: s.acceptsPickup,
      deliveryFeeCents: s.deliveryFeeCents,
      minOrderCents: s.minOrderCents,
      estimatedPrepMinutes: s.estimatedPrepMinutes,
      socialLinks: s.socialLinks,
      menuSettings: s.menuSettings,
    };
  },
};
