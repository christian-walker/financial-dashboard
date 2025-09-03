'use server';
import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const {customerId, amount, status} = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100; //convert dollars to cents
    const date = new Date().toISOString().split('T')[0];

    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    revalidatePath('/dashboard/invoices'); //refresh the invoices page
    redirect('/dashboard/invoices'); //redirect to the invoices page

   
}

export async function updateInvoice(id: string, formData: FormData) {
    const {customerId, amount, status} = UpdateInvoice.parse({ // UpdateInvoice is the schema for the form data
        customerId: formData.get('customerId'), // customerId is from the FormSchema
        amount: formData.get('amount'), // amount is from the FormSchema
        status: formData.get('status'), // status is from the FormSchema
    })

    const amountInCents = amount * 100; //convert dollars to cents

    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;

    revalidatePath('/dashboard/invoices'); //refresh the invoices page
    redirect('/dashboard/invoices'); //redirect to the invoices page

   
}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices'); //refresh the invoices page
}