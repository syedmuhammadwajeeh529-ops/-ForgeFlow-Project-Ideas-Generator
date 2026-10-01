const API_URL = "http://localhost:5000/api";

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export const base44 = {
  entities: {
    ProjectIdea: {
      list: async () => {
        return await request("/project-ideas");
      },
    },

    SavedProject: {
      list: async () => {
        return await request("/saved-projects");
      },

      create: async (data) => {
        return await request("/saved-projects", {
          method: "POST",
          body: JSON.stringify(data),
        });
      },

      update: async (id, data) => {
        return await request(`/saved-projects/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      },

      delete: async (id) => {
        return await request(`/saved-projects/${id}`, {
          method: "DELETE",
        });
      },
    },

    ProjectVersion: {
      filter: async () => {
        return [];
      },

      list: async () => {
        return [];
      },

      create: async () => {
        return {};
      },
    },
  },

  integrations: {
    Core: {
      InvokeLLM: async () => {
        throw new Error(
          "LLM backend has not been migrated yet."
        );
      },
    },
  },
};