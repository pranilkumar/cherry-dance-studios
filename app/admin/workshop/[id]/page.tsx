import WorkshopDetailAdmin from '../../../../src/components/admin/WorkshopDetailAdmin';

export default async function Page({ params }) {
  const { id } = await params;
  return <WorkshopDetailAdmin workshopId={id} />;
}
