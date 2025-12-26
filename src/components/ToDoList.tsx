import React, { useEffect, useRef, useState } from 'react';
import type { Task } from './Types';
import db from '../firebase/config';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { Popover, PopoverContent, PopoverTrigger } from '@/shadcn/Popover';
import { PopoverAnchor } from '@radix-ui/react-popover';

function TodoList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [taskUnderUpdate, setTaskUnderUpdate] = useState('');

    const tasksRef = ref(db, 'tasks');

    useEffect(() => {
        const unsubscribe = onValue(tasksRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                const taskArray: Task[] = Object.keys(data).map((key) => {
                    return {
                        userId: key,
                        writtenAt: data[key].addedOn,
                        text: data[key].taskText,
                        completed: data[key].complete
                    };
                });

                // newest first
                taskArray.sort((a, b) => (b.writtenAt - a.writtenAt));
                setTasks(taskArray);
            }
            else setTasks([]);
        });

        return () => unsubscribe();
    }, [tasksRef]);

    const addTask = async () => {
        if (!newTask.trim()) return;
        try {
            await push(tasksRef, {
                taskText: newTask.trim(),
                complete: false,
                addedOn: Date.now()
            });

            setNewTask('');
        }
        catch (err) {
            console.log('Error adding task: ', err);
        }
    };

    const toggleTaskCompletion = async (id: string, done: boolean) => {
        try {
            const taskItemRef = ref(db, `tasks/${id}`);
            await update(taskItemRef, {
                complete: !done
            });
        }
        catch (err) {
            console.log('Error updating task completion: ', err);
        }
    };

    const completeUpdate = async (id: string, text?: string) => {
        try {
            const taskItemRef = ref(db, `tasks/${id}`);
            if (text?.trim()) {
                await update(taskItemRef, {
                    taskText: text.trim(),
                })
                setPopoverOpenID(null);
                setTaskUnderUpdate('');
            }
            else {
                alert("Task cannot be empty!");
                throw new Error('Empty task!');
            }
        }
        catch (err) {
            console.log('Error updating task: ', err);
        }
    };

    const deleteTask = async (id: string) => {
        try {
            const taskItemRef = ref(db, `tasks/${id}`);
            await remove(taskItemRef);
        }
        catch (err) {
            console.log('Error deleting task: ', err);
        }
    };

    const popoverTyping = (val: string): void => {
        setTaskUnderUpdate(val);
    }

    const [popoverOpenID, setPopoverOpenID] = useState<number | null>(null);
    const popoverInputRef = useRef<HTMLTextAreaElement | null>(null);

    const outsidePopoverClickHandler = (id: number, isOpen: boolean, text: string) => {

        if (isOpen) {
            setPopoverOpenID(id);
            setTaskUnderUpdate(text);
        }
        else {
            // just closed
            setPopoverOpenID(null);
            setTaskUnderUpdate('');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-4 bg-gray-600 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">Todo List</h1>
            <div className="flex mb-1 pb-4 border-b-[1.5px]">
                <textarea
                    rows={1}
                    className="flex-1 p-2 border rounded text-gray-100 outline-0 min-h-10.25 wrap-break-word resize-y"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addTask();
                        }
                    }}
                    placeholder="Add a new task..."
                />
                <button
                    onClick={addTask}
                    className="ml-2 p-2 bg-amber-600 text-white rounded hover:bg-amber-800"
                >
                    Add
                </button>
            </div>
            <ul className='max-w-md'>
                {tasks.map((task, index) => (
                    <li key={index} className="flex w-full justify-between items-center py-2 border-b-[0.5px] border-amber-300 text-gray-100">
                        <span
                            className={`flex-1 px-1.5 border-l border-r w-[60%] overflow-hidden wrap-break-word ${task.completed ? 'line-through decoration-amber-300 text-gray-400' : ''}`}
                            onClick={() => toggleTaskCompletion(task.userId, task.completed)}
                        >
                            {task.text.slice(0, (task.text.length > 63) ? 63 : task.text.length)}
                        </span>
                        <Popover modal={true} open={popoverOpenID === index} onOpenChange={(isOpen) => outsidePopoverClickHandler(index, isOpen, task.text)}>
                            <PopoverTrigger>
                                <button
                                    onClick={() => { }}
                                    className="ml-4 p-1 w-15 bg-teal-500 text-white rounded hover:bg-teal-700"
                                >
                                    Edit
                                </button>
                            </PopoverTrigger>
                            <PopoverAnchor>
                                <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0 w-0'></div>
                            </PopoverAnchor>
                            <PopoverContent onOpenAutoFocus={() => {
                                if (popoverInputRef.current) {
                                    popoverInputRef.current.style.height = 'auto';
                                    popoverInputRef.current.style.height = (popoverInputRef.current.scrollHeight + 1) + 'px';
                                    setTimeout(() => { popoverInputRef.current?.focus(); popoverInputRef.current?.select(); }, 50);
                                }
                            }} side='left' sideOffset={-16.5} align='center' avoidCollisions={false} className='w-93.25 bg-gray-300/95 dark:bg-gray-800/90 z-100 backdrop-blur-lg shadow-2xl shadow-black/80 border border-white/80  dark:border-gray-500/60 ring-1 ring-black/10 flex flex-row justify-between items-center'>
                                <textarea
                                    ref={(reference) => {
                                        if (popoverOpenID === index) popoverInputRef.current = reference;
                                    }}
                                    className="flex-1 px-1.5 py-1 border-l border-r rounded text-gray-100 outline-0 w-full text-center wrap-break-word resize-none" rows={1}
                                    value={taskUnderUpdate}

                                    onInput={(e) => {
                                        e.currentTarget.style.height = 'auto';
                                        e.currentTarget.style.height = (e.currentTarget.scrollHeight + 1) + 'px';
                                    }}
                                    onChange={(e) => {
                                        popoverTyping(e.target.value);
                                    }}
                                    onKeyDown={(e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            completeUpdate(task.userId, popoverInputRef.current?.value);
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => completeUpdate(task.userId, popoverInputRef.current?.value)}
                                    className="ml-4 px-1 py-1 w-15 bg-emerald-500 text-white rounded hover:bg-emerald-600 active:bg-emerald-800 font-medium shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-150 backdrop-blur-sm border border-emerald-400/30 focus:outline-none focus:ring-2 focus:ring-emerald-800/40 focus:ring-offset-0 flex gap-2"
                                >
                                    Update
                                </button>
                            </PopoverContent>
                        </Popover>
                        <button
                            onClick={() => deleteTask(task.userId)}
                            className="ml-4 p-1 w-15 bg-red-400 text-white rounded hover:bg-red-600"
                        >
                            {/* A confirm button needs to be added some day */}
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TodoList;
