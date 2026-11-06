import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const dictionaries = {
  en: {
    appName: 'Smart Inventory',
    appTagline: 'Stock control, simplified',
    'tab.overview': 'Overview',
    'tab.items': 'Items',
    'tab.alerts': 'Alerts',
    'tab.reports': 'Reports',

    'common.loading': 'Loading…',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.units': 'units',

    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',

    'summary.products': 'Products',
    'summary.units': 'Units in stock',
    'summary.value': 'Stock value',
    'summary.low': 'Low stock',
    'summary.out': 'Out of stock',

    'items.searchPlaceholder': 'Search by name or SKU…',
    'items.add': 'Add item',
    'items.empty': 'No items yet. Add your first product.',
    'items.noResults': 'No items match your search.',
    'items.sku': 'SKU',
    'items.name': 'Name',
    'items.category': 'Category',
    'items.qty': 'Qty',
    'items.reorderAt': 'Reorder at',
    'items.reorderLevel': 'Reorder level',
    'items.price': 'Price',
    'items.unitPrice': 'Unit price',
    'items.status': 'Status',
    'items.addStock': 'Add stock',
    'items.removeStock': 'Remove stock',
    'items.newItem': 'New item',
    'status.ok': 'In stock',
    'status.low': 'Low',
    'status.out': 'Out of stock',

    'adjust.addTitle': 'Add stock',
    'adjust.removeTitle': 'Remove stock',
    'adjust.howMany': 'How many units?',
    'adjust.reason': 'Reason (optional)',
    'adjust.restock': 'Restock',
    'adjust.sale': 'Sale',
    'adjust.current': 'Current quantity',
    'delete.title': 'Delete item',
    'delete.body': 'Delete “{name}”? This cannot be undone.',

    'alerts.latest': 'Latest low-stock alerts',
    'alerts.active': 'Active low-stock alerts',
    'alerts.checkNow': 'Check now',
    'alerts.none': 'All stocked up — no active alerts.',
    'alerts.left': '{qty} left · reorder at {level}',
    'severity.critical': 'Critical',
    'severity.warning': 'Warning',

    'reports.byCategory': 'Stock value by category',
    'reports.export': 'Export CSV',
    'reports.noData': 'No data yet.',
    'reports.movements': 'Stock movements (last 14 days)',
    'reports.noMovements': 'No movements recorded yet.',
    'reports.day': 'Day',
    'reports.in': 'Stock in',
    'reports.out': 'Stock out',
  },
  ar: {
    appName: 'المخزون الذكي',
    appTagline: 'إدارة المخزون بكل سهولة',
    'tab.overview': 'نظرة عامة',
    'tab.items': 'المنتجات',
    'tab.alerts': 'التنبيهات',
    'tab.reports': 'التقارير',

    'common.loading': 'جارٍ التحميل…',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.confirm': 'تأكيد',
    'common.units': 'وحدة',

    'settings.language': 'اللغة',
    'settings.theme': 'المظهر',
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.system': 'حسب النظام',

    'summary.products': 'المنتجات',
    'summary.units': 'الوحدات في المخزون',
    'summary.value': 'قيمة المخزون',
    'summary.low': 'مخزون منخفض',
    'summary.out': 'نفد من المخزون',

    'items.searchPlaceholder': 'ابحث بالاسم أو رمز المنتج…',
    'items.add': 'إضافة منتج',
    'items.empty': 'لا توجد منتجات بعد. أضف أول منتج لك.',
    'items.noResults': 'لا توجد منتجات مطابقة لبحثك.',
    'items.sku': 'رمز المنتج',
    'items.name': 'الاسم',
    'items.category': 'الفئة',
    'items.qty': 'الكمية',
    'items.reorderAt': 'حد إعادة الطلب',
    'items.reorderLevel': 'حد إعادة الطلب',
    'items.price': 'السعر',
    'items.unitPrice': 'سعر الوحدة',
    'items.status': 'الحالة',
    'items.addStock': 'إضافة مخزون',
    'items.removeStock': 'سحب مخزون',
    'items.newItem': 'منتج جديد',
    'status.ok': 'متوفر',
    'status.low': 'منخفض',
    'status.out': 'نفد المخزون',

    'adjust.addTitle': 'إضافة مخزون',
    'adjust.removeTitle': 'سحب مخزون',
    'adjust.howMany': 'كم عدد الوحدات؟',
    'adjust.reason': 'السبب (اختياري)',
    'adjust.restock': 'إعادة تخزين',
    'adjust.sale': 'بيع',
    'adjust.current': 'الكمية الحالية',
    'delete.title': 'حذف المنتج',
    'delete.body': 'هل تريد حذف «{name}»؟ لا يمكن التراجع عن هذا الإجراء.',

    'alerts.latest': 'أحدث تنبيهات انخفاض المخزون',
    'alerts.active': 'تنبيهات انخفاض المخزون النشطة',
    'alerts.checkNow': 'فحص الآن',
    'alerts.none': 'المخزون ممتلئ — لا توجد تنبيهات نشطة.',
    'alerts.left': 'المتبقي {qty} · إعادة الطلب عند {level}',
    'severity.critical': 'حرج',
    'severity.warning': 'تحذير',

    'reports.byCategory': 'قيمة المخزون حسب الفئة',
    'reports.export': 'تصدير CSV',
    'reports.noData': 'لا توجد بيانات بعد.',
    'reports.movements': 'حركة المخزون (آخر 14 يومًا)',
    'reports.noMovements': 'لم تُسجَّل أي حركات بعد.',
    'reports.day': 'اليوم',
    'reports.in': 'وارد',
    'reports.out': 'صادر',
  },
};

const LANGS = ['en', 'ar'];
const I18nContext = createContext(null);

function initialLang() {
  try {
    const saved = localStorage.getItem('si-lang');
    if (LANGS.includes(saved)) return saved;
  } catch {}
  return (navigator.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = dir;
    document.title = dictionaries[lang].appName;
    try { localStorage.setItem('si-lang', lang); } catch {}
  }, [lang, dir]);

  const t = useCallback(
    (key, vars) => {
      let s = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
      return s;
    },
    [lang],
  );

  const fmt = useMemo(() => {
    // 'ar-u-nu-latn' keeps Western digits (0-9) which match the API / CSV data;
    // change to plain 'ar' if you prefer Arabic-Indic digits (٠١٢٣).
    const locale = lang === 'ar' ? 'ar-u-nu-latn' : 'en-US';
    const num = new Intl.NumberFormat(locale);
    const cur = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' });
    const date = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    return {
      number: (n) => num.format(Number(n) || 0),
      currency: (n) => cur.format(Number(n) || 0),
      date: (d) => {
        const dt = new Date(d);
        return Number.isNaN(dt.getTime()) ? String(d) : date.format(dt);
      },
    };
  }, [lang]);

  const value = useMemo(
    () => ({ lang, dir, t, fmt, setLang: setLangState, toggleLang: () => setLangState((l) => (l === 'en' ? 'ar' : 'en')) }),
    [lang, dir, t, fmt],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
