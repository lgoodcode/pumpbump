import { Task, TaskDB } from "@/utils/task-manager/types.ts";
import { supabase } from "@/lib/supabase/client.ts";

export const BUMP_DB: TaskDB<Task> = {
  async createTask(task) {
    const { error } = await supabase.from("bumps").insert({
      id: task.id,
      user_id: task.userId,
      total_runs: task.totalRuns,
      interval: task.interval,
      action: task.action,
      params: task.params,
      status: task.status,
    });

    if (error) {
      throw error;
    }
  },

  /**
   * The type of the `params` argument is not the same as what we store in the database
   * so, we select the fields we want to update and update them.
   *
   * @param id The id of the task to update
   * @param params The fields to update
   */
  async updateTask(id, params) {
    // deno-lint-ignore no-explicit-any
    const updates: Record<string, any> = {};

    if (params.status) {
      updates["status"] = params.status;
    }
    if (params.failedRuns) {
      updates["failed_runs"] = params.failedRuns;
    }
    if (params.completedRuns) {
      updates["completed_runs"] = params.completedRuns;
    }

    const { error } = await supabase.from("bumps").update(updates).eq("id", id);
    if (error) {
      throw error;
    }
  },

  async deleteTask(id) {
    const { error } = await supabase.from("bumps").delete().eq("id", id);
    if (error) {
      throw error;
    }
  },

  async saveRun(taskId, runId, success) {
    const { error } = await supabase.from("task_runs").insert({
      id: runId,
      task_id: taskId,
      success,
    });
    if (error) {
      throw error;
    }
  },

  async completeTask(task) {
    const { error } = await supabase.rpc("finish_bump", {
      task_id: task.id,
      final_status: task.status,
    });
    if (error) {
      throw error;
    }
  },
};
