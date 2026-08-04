import type { FormEvent } from 'react';
import DirtyBanner from '@/components/admin/DirtyBanner';
import type { Amenity, DayRateForm, WeekdayRateForm } from './types';
import type { RoomForm } from './formDefaults';
import RoomFeatureFields from './RoomFeatureFields';
import RoomPricingFields from './RoomPricingFields';

type Props = {
  editing: boolean;
  dirty: boolean;
  form: RoomForm;
  amenities: Amenity[];
  weekdayRates: DayRateForm;
  weekendRates: DayRateForm;
  weekdayRateRules: WeekdayRateForm[];
  onFormChange: (form: RoomForm) => void;
  onWeekdayChange: (rates: DayRateForm) => void;
  onWeekendChange: (rates: DayRateForm) => void;
  onWeekdayRateRulesChange: (rules: WeekdayRateForm[]) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function RoomEditorForm({
  editing,
  dirty,
  form,
  amenities,
  weekdayRates,
  weekendRates,
  weekdayRateRules,
  onFormChange,
  onWeekdayChange,
  onWeekendChange,
  onWeekdayRateRulesChange,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          {editing ? 'Editar Habitación' : 'Nueva Habitación'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Cerrar formulario de habitación"
          title="Cerrar"
        >
          <span aria-hidden="true" className="text-2xl leading-none">×</span>
        </button>
      </div>
      <DirtyBanner visible={dirty} />
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nombre *</label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => onFormChange({ ...form, name: event.target.value })}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="Ej: Suite Romántica"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
          <textarea
            value={form.description}
            onChange={(event) => onFormChange({ ...form, description: event.target.value })}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            rows={2}
            placeholder="Descripción opcional de la habitación"
          />
        </div>
        <RoomPricingFields
          basePrices={form}
          weekdayRates={weekdayRates}
          weekendRates={weekendRates}
          onBaseChange={(field, value) => onFormChange({ ...form, [field]: value })}
          onWeekdayChange={onWeekdayChange}
          onWeekendChange={onWeekendChange}
          weekdayRateRules={weekdayRateRules}
          onWeekdayRateRulesChange={onWeekdayRateRulesChange}
        />
        <RoomFeatureFields form={form} amenities={amenities} onChange={onFormChange} />
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            Cancelar
          </button>
          <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm shadow-purple-200">
            {editing ? 'Actualizar Habitación' : 'Crear Habitación'}
          </button>
        </div>
      </form>
    </>
  );
}
