// src/app/api/docs/route.ts (ou .js, conforme seu projeto)
export async function GET() {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "API de Condomínios - Plataforma GMP+",
      version: "1.0.0",
      description:
        "Documentação da API REST responsável por gerenciar condomínios da plataforma GMP+. Todos os endpoints seguem o padrão JSON.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],
    paths: {
      "/api/condominios": {
        get: {
          summary: "Listar todos os condomínios",
          tags: ["Condomínios"],
          responses: {
            200: {
              description: "Lista de todos os condomínios",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Condominio" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Criar um novo condomínio",
          tags: ["Condomínios"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CondominioInput" },
                example: {
                  name: "Condomínio Vale Verde",
                  cnpj: "12.345.678/0001-99",
                  address: "Rua das Acácias, 101",
                  neighborhood: "Bela Vista",
                  city: "Fortaleza",
                  state: "CE",
                  type: "Residencial",
                  imageUrl: "https://exemplo.com/condominio.jpg",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Condomínio criado com sucesso",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Condominio" },
                },
              },
            },
          },
        },
      },
      "/api/condominios/{id}": {
        put: {
          summary: "Atualizar condomínio por ID",
          tags: ["Condomínios"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "ID do condomínio a ser atualizado",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CondominioInput" },
                example: {
                  name: "Condomínio Alterado",
                  cnpj: "99.999.999/0001-00",
                  address: "Rua Nova, 500",
                  neighborhood: "Centro",
                  city: "São Paulo",
                  state: "SP",
                  type: "Comercial",
                  imageUrl: null,
                },
              },
            },
          },
          responses: {
            200: {
              description: "Condomínio atualizado com sucesso",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Condominio" },
                },
              },
            },
          },
        },
        delete: {
          summary: "Deletar condomínio por ID",
          tags: ["Condomínios"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "ID do condomínio a ser removido",
            },
          ],
          responses: {
            200: {
              description: "Condomínio deletado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Deletado com sucesso",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        CondominioInput: {
          type: "object",
          required: [
            "name",
            "address",
            "neighborhood",
            "city",
            "state",
            "type",
          ],
          properties: {
            name: {
              type: "string",
              description: "Nome do condomínio",
              example: "Condomínio Novo Horizonte",
            },
            cnpj: {
              type: "string",
              nullable: true,
              description: "CNPJ do condomínio (opcional)",
              example: "11.222.333/0001-44",
            },
            address: {
              type: "string",
              description: "Endereço completo do condomínio",
              example: "Avenida Brasil, 1000",
            },
            neighborhood: {
              type: "string",
              description: "Bairro do condomínio",
              example: "Jardins",
            },
            city: {
              type: "string",
              description: "Cidade do condomínio",
              example: "Recife",
            },
            state: {
              type: "string",
              description: "Estado (UF) do condomínio",
              example: "PE",
            },
            type: {
              type: "string",
              description: "Tipo do condomínio (Residencial, Comercial, Misto)",
              example: "Residencial",
            },
            imageUrl: {
              type: "string",
              nullable: true,
              description: "URL da imagem do condomínio (opcional)",
              example: "https://exemplo.com/imagem.jpg",
            },
          },
        },
        Condominio: {
          allOf: [
            { $ref: "#/components/schemas/CondominioInput" },
            {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                  description: "Identificador único do condomínio",
                  example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                },
                createdAt: {
                  type: "string",
                  format: "date-time",
                  description: "Data de criação do registro",
                },
                updatedAt: {
                  type: "string",
                  format: "date-time",
                  description: "Data da última atualização do registro",
                },
              },
            },
          ],
        },
      },
    },
  };

  return Response.json(spec);
}
