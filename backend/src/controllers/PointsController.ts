import knex from '../database/connection';
import { Response, Request } from 'express';

class PointsController {
  async create(request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items
    } = request.body;
  
    const tsx = await knex.transaction();
  
    const point = {
      image: request.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    }

    const insertedIds = await tsx('points').insert(point);
  
    const point_id = insertedIds[0];
  
    const pointItems = items
      .split(',')
      .map((item: string) => Number(item.trim()))
      .map((item_id: number) => ({
      item_id,
      point_id,
    }));
  
    await tsx('point_item').insert(pointItems);

    await tsx.commit();
  
    return response.status(200).json({
      id: point_id,
      ...point,
    });
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex('points').where('id', id).first();

    if (!point) {
      return response.status(400).json({ error: 'Client not Founr' });
    }

    const serializedPoint = {
      ...point,
      image_url: `http://192.168.15.79:3333/uploads/${point.image}`
    }

    const items = await knex('items')
      .join('point_item', 'items.id', '=', 'point_item.item_id')
      .where('point_item.point_id', id)
      .select('items.title');

    return response.status(200).json({ point: serializedPoint, items })
  }

  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

    const points = await knex('points')
      .join('point_item', 'points.id', '=', 'point_item.point_id')
      .whereIn('point_item.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

      const serializedPoints = points.map(point => {
        return {
          ...point,
          image_url: `http://192.168.15.79:3333/uploads/${point.image}`
        }
      })
  
    return response.status(200).json(serializedPoints);
  }
}

export default new PointsController;