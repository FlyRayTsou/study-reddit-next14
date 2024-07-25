'use server';

import type { Topic } from '@prisma/client'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/auth';
import { db } from '@/db';
import paths from '@/paths'

const createTopicSchema = z.object({
    name: z.string().min(3).regex(/[a-z-]+$/, { message : "Must be lowercase letters or dashed without spaces" }),
    description: z.string().min(10),
})

interface CreateTopicFormState {
    errors: {
        name?: string[],
        description?: string[],
        _form?: string[]
        
    }
}

export async function createTopic(formState: CreateTopicFormState, formData: FormData): Promise<CreateTopicFormState> {
    // await new Promise(resolve => setTimeout(resolve, 2500))
    const result = createTopicSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description')
    })
    console.log(result)
    if (!result.success) {
        // console.log(result.error.flatten().fieldErrors)
        return {
            errors: result.error.flatten().fieldErrors
        }
    }
    const session = await auth();
    if (!session || !session.user) {
        return {
            errors: {
                _form: ['You must be logged in to create a topic']
            }
        }
    }

    let topic: Topic;
    try {
        topic = await db.topic.create({
            data: {
                slug: result.data.name,
                description: result.data.description,
            }
        })
    } catch (error: unknown) {
        if (error instanceof Error) {
            return {
                errors: {
                    _form: [error.message]
                }
            }
        } else {
            return {
                errors: {
                    _form: ['Something went wrong']
                }
            }
        }

    }

    revalidatePath('/')
    redirect(paths.topicShow(topic.slug))
    // const name = formData.get('name');
    // const description = formData.get('description');
    // console.log(name, description)
}