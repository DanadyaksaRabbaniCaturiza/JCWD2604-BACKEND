/** @format */

import { Response, Request, NextFunction } from "express";
import { prisma, redis } from "..";
import { Prisma } from "@prisma/client";
import { ReqUser } from "../middlewares/auth-middleware";

export const productController = {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { product_name } = req.query;
      // console.log(product_name);

      let products;

      const cachedData = await redis.get(String(product_name));

      if (!cachedData) {
        products = await prisma.product.findMany({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          where: {
            product_name: {
              contains: String(product_name),
            },
          },
        });

        await redis.set(
          String(product_name),
          JSON.stringify(products),
          "EX",
          6000
        );
      }

      res.send({
        success: true,
        result: JSON.parse(String(cachedData)) || products,
      });
    } catch (error) {
      next(error);
    }
  },
  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await prisma.product.findUnique({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        where: {
          id: Number(req.params.id),
        },
      });

      res.send({
        success: true,
        result: products,
      });
    } catch (error) {
      next(error);
    }
  },
  async editProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { product_name, image_url, price, description } = req.body;
      const editProduct: Prisma.ProductUpdateInput = {
        product_name,
        price,
        description,
      };
      console.log(req.file);

      await prisma.product.update({
        data: editProduct,
        where: {
          id: Number(req.params.id),
        },
      });
      res.send({
        success: true,
        message: "data berhasil diedit",
      });
    } catch (error) {
      next(error);
    }
  },
  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.product.delete({
        where: {
          id: Number(req.params.id),
        },
      });
      res.send({
        success: true,
        message: "data berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  },
  async addProduct(req: ReqUser, res: Response, next: NextFunction) {
    try {
      const { product_name, description, price } = req.body;
      const newProduct: Prisma.ProductCreateInput = {
        product_name,
        image_url: req.file?.filename,
        price,
        description,
        user: {
          connect: {
            id: req.user?.id,
          },
        },
      };

      await prisma.product.create({
        data: newProduct,
      });
      res.send({
        success: true,
        message: "data berhasil ditambahkan",
      });
    } catch (error) {
      next(error);
    }
  },
};
