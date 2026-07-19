import { fireEvent, render, screen } from '@testing-library/react';
import PromoEditorForm from '@/components/admin/motel-detail/PromoEditorForm';
import { createInitialPromoForm } from '@/components/admin/motel-detail/formDefaults';

describe('PromoEditorForm', () => {
  it('delegates title changes and submission', () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn((event) => event.preventDefault());
    render(<PromoEditorForm editing={false} dirty={false} uploading={false} canPublishGlobally form={{ ...createInitialPromoForm(), title: 'Promo inicial' }} onChange={onChange} onFileChange={jest.fn()} onCancel={jest.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'Promo nueva' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'Promo nueva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear Promo' }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
