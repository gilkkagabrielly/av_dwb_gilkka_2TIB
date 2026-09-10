import jwt from "jsonwebtoken";

const CHAVE_SECRETA = "chave-secreta-api";

function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            erro: "Token não fornecido"
        });
    }

    const partes = authHeader.split(" ");

    const token = partes[1];

    if (!token) {
        return res.status(401).json({
            erro: "Token não fornecido"
        });
    }

    try {
        const usuario = jwt.verify(token, CHAVE_SECRETA);

        req.usuario = usuario;

        next();
    } catch (erro) {
        return res.status(401).json({
            erro: "Token inválido ou expirado"
        });
    }
}

export default autenticar;