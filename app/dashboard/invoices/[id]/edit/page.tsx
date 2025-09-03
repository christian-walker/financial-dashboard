import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { fetchInvoiceById } from '@/app/lib/data';
 

type Props = {
  params: Promise<{id: string}>
}

export default async function Page(props: Props) {
  const id = (await props.params).id;
  // const customers = await fetchCustomers();
  // const invoice = await fetchInvoiceById(id);
  const [customers, invoice] = await Promise.all([fetchCustomers(), fetchInvoiceById(id)]);
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}