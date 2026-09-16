import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import swaggerUi from "swagger-ui-express";

import autenticar from "./middleware/auth.js";

const app = express();
const PORT = 3000;
const CHAVE_SECRETA = "chave-secreta-api";

app.use(express.json());

// =========================
// AV1 - CATÁLOGO DE FILMES
// =========================

let filmes = [
    {
        id: 1,
        titulo: "Avengers: Doomsday",
        genero: "Ação, Ficção científica, Super-herói",
        ano: 2026,
        diretor: "Anthony Russo e Joe Russo"
    },
    {
        id: 2,
        titulo: "Spider-Man: Brand New Day",
        genero: "Ação, Aventura, Ficção científica",
        ano: 2026,
        diretor: "Destin Daniel Cretton"
    }
];

let proximoId = 3;

// LISTAR FILMES
app.get("/filmes", autenticar, (req, res) => {
    res.status(200).json(filmes);
});

// CONSULTAR FILME POR ID
app.get("/filmes/:id", autenticar, (req, res) => {
    const id = Number(req.params.id);

    const filme = filmes.find((filme) => filme.id === id);

    if (!filme) {
        return res.status(404).json({
            mensagem: "Filme não encontrado."
        });
    }

    res.status(200).json(filme);
});

// CADASTRAR FILME
app.post("/filmes", autenticar, (req, res) => {
    const { titulo, genero, ano, diretor } = req.body;

    if (!titulo || !genero || !ano || !diretor) {
        return res.status(400).json({
            mensagem: "Todos os campos são obrigatórios."
        });
    }

    const novoFilme = {
        id: proximoId++,
        titulo,
        genero,
        ano,
        diretor
    };

    filmes.push(novoFilme);

    res.status(201).json(novoFilme);
});

// EDITAR FILME
app.put("/filmes/:id", autenticar, (req, res) => {
    const id = Number(req.params.id);

    const indice = filmes.findIndex((filme) => filme.id === id);

    if (indice === -1) {
        return res.status(404).json({
            mensagem: "Filme não encontrado."
        });
    }

    const { titulo, genero, ano, diretor } = req.body;

    if (!titulo || !genero || !ano || !diretor) {
        return res.status(400).json({
            mensagem: "Todos os campos são obrigatórios."
        });
    }

    filmes[indice] = {
        id,
        titulo,
        genero,
        ano,
        diretor
    };

    res.status(200).json({
        mensagem: "Filme atualizado com sucesso.",
        filme: filmes[indice]
    });
});

// EXCLUIR FILME
app.delete("/filmes/:id", autenticar, (req, res) => {
    const id = Number(req.params.id);

    const indice = filmes.findIndex((filme) => filme.id === id);

    if (indice === -1) {
        return res.status(404).json({
            mensagem: "Filme não encontrado."
        });
    }

    const filmeRemovido = filmes[indice];

    filmes.splice(indice, 1);

    res.status(200).json({
        mensagem: "Filme excluído com sucesso.",
        filme: filmeRemovido
    });
});

// =========================
// AV2 - USUÁRIOS E LOGIN
// =========================

let usuarios = [];
let proximoIdUsuario = 1;

// CADASTRAR USUÁRIO
app.post("/usuarios", async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            mensagem: "Nome, email e senha são obrigatórios."
        });
    }

    const usuarioExistente = usuarios.find(
        (usuario) => usuario.email === email
    );

    if (usuarioExistente) {
        return res.status(409).json({
            mensagem: "Este email já está cadastrado."
        });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = {
        id: proximoIdUsuario++,
        nome,
        email,
        senha: senhaCriptografada
    };

    usuarios.push(novoUsuario);

    res.status(201).json({
        mensagem: "Usuário cadastrado com sucesso.",
        usuario: {
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email
        }
    });
});

// LOGIN
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            mensagem: "Email e senha são obrigatórios."
        });
    }

    const usuario = usuarios.find(
        (usuario) => usuario.email === email
    );

    if (!usuario) {
        return res.status(401).json({
            mensagem: "Email ou senha incorretos."
        });
    }

    const senhaCorreta = await bcrypt.compare(
        senha,
        usuario.senha
    );

    if (!senhaCorreta) {
        return res.status(401).json({
            mensagem: "Email ou senha incorretos."
        });
    }

    const token = jwt.sign(
        {
            id: usuario.id,
            email: usuario.email
        },
        CHAVE_SECRETA,
        {
            expiresIn: "1h"
        }
    );

    res.status(200).json({
        mensagem: "Login realizado com sucesso.",
        token
    });
});

// =========================
// AV2 - UPLOAD
// =========================

const armazenamento = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        const nomeArquivo =
            Date.now() + "-" + file.originalname;

        cb(null, nomeArquivo);
    }
});

const upload = multer({
    storage: armazenamento,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === "image/jpeg" ||
            file.mimetype === "image/png"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens JPG e PNG são permitidas."));
        }
    }
});

// ENVIAR IMAGEM
app.post(
    "/upload",
    autenticar,
    upload.single("imagem"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                mensagem: "Nenhuma imagem enviada."
            });
        }

        res.status(201).json({
            mensagem: "Imagem enviada com sucesso.",
            arquivo: req.file.filename
        });
    }
);

// ERROS DO MULTER
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                mensagem: "A imagem deve ter no máximo 2 MB."
            });
        }

        return res.status(400).json({
            mensagem: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            mensagem: err.message
        });
    }

    next();
});

// =========================
// AV2 - SWAGGER
// =========================

const swaggerDocument = {
    openapi: "3.0.0",

    info: {
        title: "API Catálogo de Filmes",
        version: "1.0.0",
        description: "API desenvolvida para as atividades AV1 e AV2."
    },

    servers: [
        {
            url: "http://localhost:3000"
        }
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },

        schemas: {
            Filme: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        example: 1
                    },
                    titulo: {
                        type: "string",
                        example: "Avengers: Doomsday"
                    },
                    genero: {
                        type: "string",
                        example: "Ação, Ficção científica, Super-herói"
                    },
                    ano: {
                        type: "integer",
                        example: 2026
                    },
                    diretor: {
                        type: "string",
                        example: "Anthony Russo e Joe Russo"
                    }
                }
            },

            FilmeEntrada: {
                type: "object",
                required: [
                    "titulo",
                    "genero",
                    "ano",
                    "diretor"
                ],
                properties: {
                    titulo: {
                        type: "string",
                        example: "Avengers: Doomsday"
                    },
                    genero: {
                        type: "string",
                        example: "Ação, Ficção científica, Super-herói"
                    },
                    ano: {
                        type: "integer",
                        example: 2026
                    },
                    diretor: {
                        type: "string",
                        example: "Anthony Russo e Joe Russo"
                    }
                }
            },

            Usuario: {
                type: "object",
                required: [
                    "nome",
                    "email",
                    "senha"
                ],
                properties: {
                    nome: {
                        type: "string",
                        example: "João"
                    },
                    email: {
                        type: "string",
                        example: "joao@email.com"
                    },
                    senha: {
                        type: "string",
                        example: "123456"
                    }
                }
            }
        }
    },

    paths: {

        // =========================
        // FILMES
        // =========================

        "/filmes": {

            get: {
                summary: "Lista todos os filmes",
                description: "Retorna todos os filmes cadastrados.",
                security: [
                    {
                        bearerAuth: []
                    }
                ],
                responses: {
                    200: {
                        description: "Lista de filmes retornada com sucesso.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Filme"
                                    }
                                }
                            }
                        }
                    },
                    401: {
                        description: "Token não fornecido ou inválido."
                    }
                }
            },

            post: {
                summary: "Cadastra um novo filme",
                description: "Cadastra um filme na lista de filmes.",
                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/FilmeEntrada"
                            }
                        }
                    }
                },

                responses: {
                    201: {
                        description: "Filme cadastrado com sucesso."
                    },
                    400: {
                        description: "Todos os campos são obrigatórios."
                    },
                    401: {
                        description: "Token não fornecido ou inválido."
                    }
                }
            }
        },

        // =========================
        // FILMES POR ID
        // =========================

        "/filmes/{id}": {

            get: {
                summary: "Consulta um filme pelo ID",
                description: "Busca um filme específico pelo seu ID.",
                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        description: "ID do filme.",
                        schema: {
                            type: "integer"
                        },
                        example: 1
                    }
                ],

                responses: {
                    200: {
                        description: "Filme encontrado com sucesso.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Filme"
                                }
                            }
                        }
                    },
                    401: {
                        description: "Token não fornecido ou inválido."
                    },
                    404: {
                        description: "Filme não encontrado."
                    }
                }
            },

            put: {
                summary: "Edita um filme pelo ID",
                description: "Atualiza os dados de um filme existente.",
                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        description: "ID do filme.",
                        schema: {
                            type: "integer"
                        },
                        example: 1
                    }
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/FilmeEntrada"
                            }
                        }
                    }
                },

                responses: {
                    200: {
                        description: "Filme atualizado com sucesso."
                    },
                    400: {
                        description: "Todos os campos são obrigatórios."
                    },
                    401: {
                        description: "Token não fornecido ou inválido."
                    },
                    404: {
                        description: "Filme não encontrado."
                    }
                }
            },

            delete: {
                summary: "Exclui um filme pelo ID",
                description: "Remove um filme pelo seu ID.",
                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        description: "ID do filme.",
                        schema: {
                            type: "integer"
                        },
                        example: 1
                    }
                ],

                responses: {
                    200: {
                        description: "Filme excluído com sucesso."
                    },
                    401: {
                        description: "Token não fornecido ou inválido."
                    },
                    404: {
                        description: "Filme não encontrado."
                    }
                }
            }
        },

        // =========================
        // USUÁRIOS
        // =========================

        "/usuarios": {

            post: {
                summary: "Cadastra um usuário",
                description: "Cria um novo usuário com senha criptografada.",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Usuario"
                            }
                        }
                    }
                },

                responses: {
                    201: {
                        description: "Usuário cadastrado com sucesso."
                    },
                    400: {
                        description: "Nome, email e senha são obrigatórios."
                    },
                    409: {
                        description: "Este email já está cadastrado."
                    }
                }
            }
        },

        // =========================
        // LOGIN
        // =========================

        "/login": {

            post: {
                summary: "Realiza login e retorna um token",
                description: "Realiza a autenticação do usuário e gera um token JWT.",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: [
                                    "email",
                                    "senha"
                                ],
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "joao@email.com"
                                    },
                                    senha: {
                                        type: "string",
                                        example: "123456"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    200: {
                        description: "Login realizado com sucesso.",
                        content: {
                            "application/json": {
                                example: {
                                    mensagem: "Login realizado com sucesso.",
                                    token: "seu-token-jwt"
                                }
                            }
                        }
                    },
                    400: {
                        description: "Email e senha são obrigatórios."
                    },
                    401: {
                        description: "Email ou senha incorretos."
                    }
                }
            }
        },

        // =========================
        // UPLOAD
        // =========================

        "/upload": {

            post: {
                summary: "Envia uma imagem",
                description: "Envia uma imagem JPG ou PNG com tamanho máximo de 2 MB.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: [
                                    "imagem"
                                ],
                                properties: {
                                    imagem: {
                                        type: "string",
                                        format: "binary",
                                        description: "Imagem JPG ou PNG de até 2 MB."
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    201: {
                        description: "Imagem enviada com sucesso."
                    },
                    400: {
                        description: "Imagem inválida ou maior que 2 MB."
                    },
                    401: {
                        description: "Token não fornecido ou inválido."
                    }
                }
            }
        }
    }
};

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

// =========================
// INICIAR SERVIDOR
// =========================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});