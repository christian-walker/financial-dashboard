'use server';
import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type State = {
    message?: string | null;
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    }
}

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fieflds. Failed to Create Invoice'
        }
    }

    const { customerId, amount , status } = validatedFields.data;
    const amountInCents = amount * 100; //convert dollars to cents
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`  
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
       return {
            message: "Database Error: Failed to Created Invoice",
       };
    }

    revalidatePath('/dashboard/invoices'); //refresh the invoices page
    redirect('/dashboard/invoices'); //redirect to the invoices page

   
}

export async function updateInvoice( id: string,prevState: State, formData: FormData) {
    const validatedFields = UpdateInvoice.safeParse({ // UpdateInvoice is the schema for the form data
        customerId: formData.get('customerId'), // customerId is from the FormSchema
        amount: formData.get('amount'), // amount is from the FormSchema
        status: formData.get('status'), // status is from the FormSchema
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fieflds. Failed to Create Invoice'
        }
    }
    
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100; //convert dollars to cents

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update Invoice',
        }
    }
    

    revalidatePath('/dashboard/invoices'); //refresh the invoices page
    redirect('/dashboard/invoices'); //redirect to the invoices page

   
}

export async function deleteInvoice(id: string) {
    throw new Error('Failed to delete invoice.');
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
    } catch (error) {
        console.error('Database Error:', error);
        
    }
    revalidatePath('/dashboard/invoices'); //refresh the invoices page
}